import os
from flask import Flask, jsonify, request, render_template, redirect, url_for
from flask_cors import CORS
from dotenv import load_dotenv
from supabase import create_client, Client
from datetime import datetime, timedelta, time, timezone
import traceback

# --- 1. CARREGAMENTO DE VARIÁVEIS DE AMBIENTE ---
# Isso lê o arquivo .env
load_dotenv()

# --- 2. CONFIGURAÇÃO DO CLIENTE SUPABASE (CORRIGIDO) ---
# CORRIGIDO: Lê as chaves do seu arquivo .env para segurança
url: str = os.getenv("SUPABASE_URL")
key: str = os.getenv("SUPABASE_KEY")

supabase: Client = None
if not url or not key:
    print("ERRO CRÍTICO: Variáveis SUPABASE_URL e SUPABASE_KEY não definidas no arquivo .env")
else:
    try:
        supabase = create_client(url, key)
        print("Cliente Supabase inicializado com sucesso!")
    except Exception as e:
        print(f"ERRO CRÍTICO ao inicializar Supabase: {e}")

# --- 3. CONSTANTES E CONFIGURAÇÕES ---
HORA_INICIO_PADRAO = time(9, 0)
HORA_FIM_PADRAO = time(18, 0)
INTERVALO_SLOT_MINUTOS = 30

# --- 4. CONFIGURAÇÃO DO FLASK E CORS (CORRIGIDO) ---
# CORRIGIDO: 'app = Flask(__name__)' usa as pastas padrão 'templates' e 'static'
app = Flask(__name__)

origins = [
    "http://127.0.0.1:5500",
    "http://localhost:5500",
    "null"
]
CORS(app, origins=origins, methods=["GET", "POST", "OPTIONS", "PUT"])

# --- ROTAS ESTÁTICAS (REMOVIDAS) ---
# Removidas pois o Flask já serve a pasta 'static/' automaticamente.

# --- ROTAS HTML (PÁGINAS) ---

@app.route('/')
def index():
    return redirect(url_for('home'))

@app.route('/home')
def home():
    # Isso agora vai encontrar 'templates/home.html'
    return render_template('home.html') 

# Páginas Raiz
@app.route('/busca')
def busca():
    return render_template('busca.html')

@app.route('/produto_detalhe')
def produto_detalhe():
    return render_template('produto_detalhe.html')

@app.route('/produtos')
def produtos():
    return render_template('produtos.html')

# Páginas Admin (Flask procura em 'templates/admin/')
@app.route('/admin/cms_editor')
def admin_cms_editor():
    return render_template('admin/cms_editor.html')

@app.route('/admin/dashboard')
def admin_dashboard():
    return render_template('admin/dashboard.html')

@app.route('/admin/gestao_agendamentos')
def admin_gestao_agendamentos():
    return render_template('admin/gestao_agendamentos.html')

@app.route('/admin/gestao_horarios')
def admin_gestao_horarios():
    return render_template('admin/gestao_horarios.html')

@app.route('/admin/gestao_produtos')
def admin_gestao_produtos():
    return render_template('admin/gestao_produtos.html')

# Páginas Institucionais (Flask procura em 'templates/paginas_institucionais/')
@app.route('/institucional/avaliacoes')
def institucional_avaliacoes():
    return render_template('paginas_institucionais/avaliacoes.html')

@app.route('/institucional/contatos')
def institucional_contatos():
    return render_template('paginas_institucionais/contatos.html')

@app.route('/institucional/lojas')
def institucional_lojas():
    return render_template('paginas_institucionais/lojas.html')

@app.route('/institucional/sobre')
def institucional_sobre():
    return render_template('paginas_institucionais/sobre.html')

# Páginas de Serviços (Flask procura em 'templates/servicos/')
@app.route('/servicos/agendamento-fluxo')
def servicos_agendamento_fluxo():
    return render_template('servicos/agendamento-fluxo.html')

@app.route('/servicos/day_care')
def servicos_day_care():
    return render_template('servicos/day_care.html')

@app.route('/servicos/hotel')
def servicos_hotel():
    return render_template('servicos/hotel.html')

@app.route('/servicos')
def servicos():
    return render_template('servicos/servicos.html')

@app.route('/servicos/veterinaria')
def servicos_veterinaria():
    return render_template('servicos/veterinaria.html')

# Páginas de Usuário (Flask procura em 'templates/usuario/')
@app.route('/usuario/criar_conta')
def usuario_criar_conta():
    return render_template('usuario/criar_conta.html')

@app.route('/usuario/favorito')
def usuario_favorito():
    return render_template('usuario/favorito.html')

@app.route('/usuario/login')
def usuario_login():
    return render_template('usuario/login.html')

@app.route('/usuario/meus_agendamentos')
def usuario_meus_agendamentos():
    return render_template('usuario/meus_agendamentos.html')

@app.route('/usuario/meus_pets')
def usuario_meus_pets():
    return render_template('usuario/meus_pets.html')

@app.route('/usuario/perfil')
def usuario_perfil():
    return render_template('usuario/perfil.html')

@app.route('/usuario/redefinir_senha')
def usuario_redefinir_senha():
    return render_template('usuario/redefinir_senha.html')

# --- 5. ROTA DE TESTE (Health Check) ---
@app.route('/api/', methods=['GET'])
def health_check():
    if supabase:
        return jsonify({"status": "API Funcionando", "supabase_connection": "OK"}), 200
    else:
        return jsonify({"status": "API Funcionando", "supabase_connection": "FALHA - Verifique .env"}), 503

# --- 6. ROTA DE CÁLCULO DE HORÁRIOS DISPONÍVEIS ---
@app.route('/api/horarios-disponiveis', methods=['GET'])
def get_available_slots():
    if not supabase:
        return jsonify({"error": "Erro interno: Conexão com banco de dados indisponível."}), 503
    try:
        loja_id_str = request.args.get('loja_id')
        servico_id_str = request.args.get('servico_id')
        data_str = request.args.get('data')
        if not loja_id_str or not servico_id_str or not data_str:
            raise ValueError("Parâmetros 'loja_id', 'servico_id' e 'data' são obrigatórios.")
        loja_id = int(loja_id_str)
        servico_id = int(servico_id_str)
        data_selecionada = datetime.strptime(data_str, '%Y-%m-%d').date()
    except (TypeError, ValueError, AttributeError) as e:
        print(f"Erro nos parâmetros recebidos: {e}")
        return jsonify({"error": "Parâmetros inválidos."}), 400
    try:
        bloqueio_res = supabase.table('dias_bloqueados').select('id_bloqueio, motivo').eq('data_bloqueada', data_str).or_(f'id_loja.eq.{loja_id},id_loja.is.null').execute()
        if bloqueio_res.data:
            return jsonify([]), 200
        regra_res = supabase.table('servicos_loja_regras').select('capacidade_simultanea, ativo, servicos(duracao_media_minutos)').eq('id_loja', loja_id).eq('id_servico', servico_id).maybe_single().execute()
        regra = regra_res.data
        if not regra or not regra['ativo']:
            return jsonify([]), 200
        capacidade = regra['capacidade_simultanea']
        duracao_servico = regra.get('servicos', {}).get('duracao_media_minutos')
        if not duracao_servico or duracao_servico <= 0:
            duracao_servico = INTERVALO_SLOT_MINUTOS
        start_of_day = datetime.combine(data_selecionada, time.min).isoformat() + "+00:00"
        end_of_day = datetime.combine(data_selecionada, time.max).isoformat() + "+00:00"
        agendamentos_existentes_res = supabase.table('agendamentos').select('data_hora_inicio, data_hora_fim').eq('id_loja', loja_id).gte('data_hora_inicio', start_of_day).lt('data_hora_inicio', end_of_day).neq('status', 'cancelado').execute()
        agendamentos_existentes = agendamentos_existentes_res.data or []
        horarios_disponiveis = []
        hora_atual = datetime.combine(data_selecionada, HORA_INICIO_PADRAO)
        hora_fim_dia = datetime.combine(data_selecionada, HORA_FIM_PADRAO)
        while hora_atual < hora_fim_dia:
            slot_inicio = hora_atual
            slot_fim = hora_atual + timedelta(minutes=duracao_servico)
            if slot_fim.time() > HORA_FIM_PADRAO:
                break
            agendamentos_conflitantes = 0
            for ag in agendamentos_existentes:
                try:
                    inicio_ag = datetime.fromisoformat(ag['data_hora_inicio'].replace('Z', '+00:00')).replace(tzinfo=None)
                    fim_ag = datetime.fromisoformat(ag['data_hora_fim'].replace('Z', '+00:00')).replace(tzinfo=None)
                    if slot_inicio < fim_ag and slot_fim > inicio_ag:
                        agendamentos_conflitantes += 1
                except Exception:
                    pass
            if agendamentos_conflitantes < capacidade:
                horarios_disponiveis.append(slot_inicio.strftime('%H:%M'))
            hora_atual += timedelta(minutes=INTERVALO_SLOT_MINUTOS)
        return jsonify(horarios_disponiveis), 200
    except Exception as e:
        print(f"ERRO GERAL /api/horarios-disponiveis: {e}")
        traceback.print_exc()
        return jsonify({"error": "Erro interno ao calcular horários."}), 500

# --- 7. ROTA DE CRIAÇÃO DE AGENDAMENTO ---
@app.route('/api/agendar', methods=['POST'])
def create_appointment():
    if not supabase:
        return jsonify({"error": "Erro DB indisponível."}), 503
    data = request.get_json()
    if not data:
        return jsonify({"error": "Sem corpo JSON."}), 400
    try:
        required_fields = ['id_cliente', 'id_loja', 'id_servico', 'data_hora_inicio']
        if not all(f in data and data[f] is not None for f in required_fields):
            missing = [f for f in required_fields if f not in data or data[f] is None]
            raise ValueError(f"Dados incompletos. Campos faltando: {', '.join(missing)}")
        id_cliente = data['id_cliente']
        id_pet = data.get('id_pet')
        loja_id = int(data['id_loja'])
        servico_id = int(data['id_servico'])
        data_hora_inicio_local = datetime.fromisoformat(data['data_hora_inicio'])
        servico_info_res = supabase.table('servicos').select('duracao_media_minutos').eq('id_servico', servico_id).maybe_single().execute()
        duracao = servico_info_res.data['duracao_media_minutos']
        data_hora_fim_local = data_hora_inicio_local + timedelta(minutes=duracao)
        regra_res = supabase.table('servicos_loja_regras').select('capacidade_simultanea').eq('id_loja', loja_id).eq('id_servico', servico_id).single().execute()
        capacidade = regra_res.data['capacidade_simultanea']
        data_hora_inicio_utc = data_hora_inicio_local.astimezone(timezone.utc)
        data_hora_fim_utc = data_hora_fim_local.astimezone(timezone.utc)
        agendamentos_conflitantes_res = supabase.table('agendamentos').select('id_agendamento', count='exact').eq('id_loja', loja_id).lt('data_hora_inicio', data_hora_fim_utc.isoformat()).gt('data_hora_fim', data_hora_inicio_utc.isoformat()).neq('status', 'cancelado').execute()
        agendamentos_conflitantes = agendamentos_conflitantes_res.count or 0
        if agendamentos_conflitantes >= capacidade:
            raise ValueError(f"Horário {data_hora_inicio_local.strftime('%H:%M')} não mais disponível.")
        insert_data = {
            'id_cliente': id_cliente,
            'id_pet': id_pet,
            'id_loja': loja_id,
            'id_servico': servico_id,
            'data_hora_inicio': data_hora_inicio_utc.isoformat(),
            'data_hora_fim': data_hora_fim_utc.isoformat(),
            'status': 'confirmado',
            'observacoes_cliente': data.get('observacoes_cliente')
        }
        insert_res = supabase.table('agendamentos').insert(insert_data).execute()
        if hasattr(insert_res, 'error') and insert_res.error:
            raise Exception("Erro DB ao salvar agendamento.")
        elif not insert_res.data:
            raise Exception("Não foi possível confirmar retorno do DB.")
        return jsonify({"message": "Agendamento criado!", "agendamento": insert_res.data[0]}), 201
    except ValueError as ve:
        print(f"Erro Validação/Conflito: {ve}")
        return jsonify({"error": str(ve)}), 409
    except Exception as e:
        print(f"ERRO GERAL /api/agendar: {e}")
        traceback.print_exc()
        return jsonify({"error": "Erro interno ao agendar."}), 500

# --- 8. ROTAS E-COMMERCE ---
@app.route('/api/ecommerce/ofertas', methods=['GET'])
def get_ofertas():
    if not supabase:
        return jsonify({"error": "DB indisponível."}), 503
    try:
        res = supabase.table('produtos').select('id_produto, nome_produto, url_imagem, preco, preco_promocional, data_cadastro').not_eq('preco_promocional', None).order('data_cadastro', desc=True).limit(8).execute()
        return jsonify(res.data), 200
    except Exception as e:
        print(f"[API_ECOMMERCE] Erro ao buscar ofertas: {e}")
        return jsonify({"error": "Falha ao carregar ofertas."}), 500

@app.route('/api/ecommerce/novidades', methods=['GET'])
def get_novidades():
    if not supabase:
        return jsonify({"error": "DB indisponível."}), 503
    try:
        res = supabase.table('produtos').select('id_produto, nome_produto, url_imagem, preco, preco_promocional, data_cadastro').order('data_cadastro', desc=True).limit(8).execute()
        return jsonify(res.data), 200
    except Exception as e:
        print(f"[API_ECOMMERCE] Erro ao buscar novidades: {e}")
        return jsonify({"error": "Falha ao carregar novidades."}), 500

@app.route('/api/ecommerce/mais-vendidos', methods=['GET'])
def get_mais_vendidos():
    if not supabase:
        return jsonify({"error": "DB indisponível."}), 503
    try:
        res = supabase.table('produtos').select('id_produto, nome_produto, url_imagem, preco, preco_promocional, quantidade_estoque').order('quantidade_estoque', desc=True).limit(12).execute()
        return jsonify(res.data), 200
    except Exception as e:
        print(f"[API_ECOMMERCE] Erro ao buscar mais vendidos: {e}")
        return jsonify({"error": "Falha ao carregar mais vendidos."}), 500

@app.route('/api/ecommerce/recomendados', methods=['GET'])
def get_recomendados():
    if not supabase:
        return jsonify({"error": "DB indisponível."}), 503
    try:
        res = supabase.table('produtos').select('id_produto, nome_produto, url_imagem, preco, preco_promocional, data_cadastro').order('data_cadastro', desc=True).limit(8).execute()
        return jsonify(res.data), 200
    except Exception as e:
        print(f"[API_ECOMMERCE] Erro ao buscar recomendados: {e}")
        return jsonify({"error": "Falha ao carregar recomendados."}), 500

# --- NOVAS ROTAS PARA CMS (Componentes de Conteúdo) ---
@app.route('/api/cms/componente/<string:nome_componente>', methods=['GET'])
def get_cms_component(nome_componente):
    if not supabase:
        return jsonify({"error": "DB indisponível."}), 503
    try:
        res = supabase.table('conteudo_cms').select('conteudo_json').eq('nome_componente', nome_componente).maybe_single().execute()
        if res.data:
            return jsonify(res.data['conteudo_json']), 200
        return jsonify({}), 404 # Retorna 404 se não encontrar
    except Exception as e:
        print(f"Erro ao buscar componente CMS '{nome_componente}': {e}")
        traceback.print_exc()
        return jsonify({"error": "Falha ao buscar conteúdo CMS."}), 500

@app.route('/api/cms/componente/<string:nome_componente>', methods=['PUT'])
def update_cms_component(nome_componente):
    if not supabase:
        return jsonify({"error": "DB indisponível."}), 503
    data = request.get_json()
    if not data:
        return jsonify({"error": "Sem corpo JSON para atualização."}), 400
    try:
        # Tenta atualizar (se existir) ou inserir (se não existir)
        res = supabase.table('conteudo_cms').upsert({'nome_componente': nome_componente, 'conteudo_json': data}, on_conflict='nome_componente').execute()
        if res.data:
            return jsonify({"message": f"Componente '{nome_componente}' atualizado com sucesso!", "data": res.data[0]}), 200
        raise Exception("Nenhum dado retornado após upsert.")
    except Exception as e:
        print(f"Erro ao atualizar componente CMS '{nome_componente}': {e}")
        traceback.print_exc()
        return jsonify({"error": "Falha ao atualizar conteúdo CMS."}), 500

# --- 9. EXECUÇÃO LOCAL ---
if __name__ == '__main__':
    app.run(debug=True, port=5000)