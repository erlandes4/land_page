"use client";
import { useState, useEffect } from "react";
import { supabase } from "../../lib/supabase";

type Lead = {
  id: number; nome: string; whatsapp: string; email: string; servico: string;
  contatado: boolean; convertido: boolean; notas: string; 
  valor: number; valor_unico: number; foto_url?: string;
  data_fechamento?: string | null; // Adicionei o | null aqui
  created_at?: string; 
};

export default function Dashboard() {
  const [sessao, setSessao] = useState<any>(null);
  const [emailLogin, setEmailLogin] = useState("");
  const [senhaLogin, setSenhaLogin] = useState("");
  const [erroLogin, setErroLogin] = useState("");
  const [carregandoAuth, setCarregandoAuth] = useState(true);

  const [leads, setLeads] = useState<Lead[]>([]);
  const [abaAtiva, setAbaAtiva] = useState<'prospeccao' | 'clientes'>('prospeccao');
  const [busca, setBusca] = useState(""); 
  
  const [modalProposta, setModalProposta] = useState<Lead | null>(null);
  const [dadosProposta, setDadosProposta] = useState({ escopo: "", valor: "", prazo: "" });
  const [arquivos, setArquivos] = useState<Record<number, any[]>>({});
  const [fazendoUpload, setFazendoUpload] = useState<number | null>(null);

  const [isDarkMode, setIsDarkMode] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then((res: any) => {
      const session = res?.data?.session;
      setSessao(session); setCarregandoAuth(false); if (session) buscarLeads();
    });
    const sub = supabase.auth.onAuthStateChange((_event: any, session: any) => {
      setSessao(session); if (session) buscarLeads();
    });
    const subscription = sub?.data?.subscription;
    return () => subscription?.unsubscribe?.();
  }, []);

  useEffect(() => {
    if (abaAtiva === 'clientes' && sessao) leads.filter(l => l.convertido).forEach(cliente => buscarArquivos(cliente.id));
  }, [abaAtiva, leads, sessao]);

  const fazerLogin = async (e: React.FormEvent) => {
    e.preventDefault(); // Impede a página de dar F5
    setErroLogin("");
    
    // Teste visual: Se esse alerta NÃO aparecer ao clicar, o botão está quebrado no HTML
    console.log("Tentando login com:", emailLogin);

    const { error } = await supabase.auth.signInWithPassword({ 
      email: emailLogin, 
      password: senhaLogin 
    });

    if (error) {
      console.error("Erro detalhado do Supabase:", error.message);
      setErroLogin(error.message === "Invalid login credentials" ? "E-mail ou senha incorretos." : error.message);
    } else {
      console.log("Login realizado com sucesso!");
    }
  };

  const fazerLogout = async () => await supabase.auth.signOut();

  async function buscarLeads() {
    const { data } = await supabase.from('leads').select('*').order('id', { ascending: false });
    if (data) setLeads(data);
  }

  const excluirLead = async (id: number) => {
    const confirmar = window.confirm("Tem certeza que deseja apagar este lead? Esta ação não pode ser desfeita.");
    if (confirmar) {
      setLeads(leads.filter(l => l.id !== id));
      await supabase.from('leads').delete().eq('id', id);
    }
  };

  const toggleContatado = async (id: number, statusAtual: boolean) => {
    const novoStatus = !statusAtual;
    setLeads(leads.map(lead => lead.id === id ? { ...lead, contatado: novoStatus } : lead));
    await supabase.from('leads').update({ contatado: novoStatus }).eq('id', id);
  };

  // ATUALIZADO: Salva a data exata em que virou cliente
  const toggleConvertido = async (id: number, statusAtual: boolean) => {
  const novoStatus = !statusAtual;
  const dataHoje = new Date().toISOString();
  // Mude de null para undefined aqui:
  const dataFechamento = novoStatus ? dataHoje : undefined; 

  setLeads(leads.map(lead => lead.id === id ? { ...lead, convertido: novoStatus, data_fechamento: dataFechamento } : lead));
  await supabase.from('leads').update({ convertido: novoStatus, data_fechamento: dataFechamento }).eq('id', id);
};

  const atualizarNotas = async (id: number, novaNota: string) => {
    setLeads(leads.map(lead => lead.id === id ? { ...lead, notas: novaNota } : lead));
    await supabase.from('leads').update({ notas: novaNota }).eq('id', id);
  };

  const atualizarValorMensal = async (id: number, novoValor: string) => {
    const valorNumerico = parseFloat(novoValor) || 0;
    setLeads(leads.map(lead => lead.id === id ? { ...lead, valor: valorNumerico } : lead));
    await supabase.from('leads').update({ valor: valorNumerico }).eq('id', id);
  };

  const atualizarValorUnico = async (id: number, novoValor: string) => {
    const valorNumerico = parseFloat(novoValor) || 0;
    setLeads(leads.map(lead => lead.id === id ? { ...lead, valor_unico: valorNumerico } : lead));
    await supabase.from('leads').update({ valor_unico: valorNumerico }).eq('id', id);
  };

  const reiniciarGrafico = async () => {
    const confirmar = window.confirm("Deseja zerar os valores de faturamento de todos os clientes? Isso limpará o gráfico atual para iniciar um novo ciclo.");
    if (confirmar) {
      setLeads(leads.map(l => ({ ...l, valor: 0, valor_unico: 0 })));
      await supabase.from('leads').update({ valor: 0, valor_unico: 0 }).neq('id', 0);
    }
  };

  const abrirWhatsApp = (nome: string, telefone: string, servico: string) => {
    const numeroLimpo = telefone.replace(/\D/g, '');
    const msg = encodeURIComponent(`Olá, ${nome}! Sou da equipe CTI Contabilidade. Vi que solicitou um diagnóstico sobre ${servico}. Como podemos ajudar?`);
    window.open(`https://wa.me/${numeroLimpo.startsWith('55') ? numeroLimpo : `55${numeroLimpo}`}?text=${msg}`, '_blank');
  };

  const abrirEmail = (nome: string, email: string, servico: string) => {
    window.open(`mailto:${email}?subject=Contato CTI Contabilidade - ${servico}`, '_blank');
  };

  const gerarTextoProposta = () => {
    if (!modalProposta) return "";
    return `*PROPOSTA CTI CONTABILIDADE* 📄\n\nOlá, *${modalProposta.nome}*!\n\n*Serviço:* ${modalProposta.servico}\n*Escopo do Trabalho:*\n${dadosProposta.escopo || "..."}\n\n*Investimento:* ${dadosProposta.valor || "R$ 0,00"}\n*Condições/Prazo:* ${dadosProposta.prazo || "A combinar"}\n\nFicamos à disposição para darmos andamento.`;
  };

  const enviarPropostaWhatsApp = () => {
    if (!modalProposta) return;
    const numeroLimpo = modalProposta.whatsapp.replace(/\D/g, '');
    window.open(`https://wa.me/${numeroLimpo.startsWith('55') ? numeroLimpo : `55${numeroLimpo}`}?text=${encodeURIComponent(gerarTextoProposta())}`, '_blank');
    setModalProposta(null);
  };

  const handleUpload = async (leadId: number, e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    setFazendoUpload(leadId);
    const file = e.target.files[0];
    const { error } = await supabase.storage.from('dossies').upload(`${leadId}/${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.]/g, '')}`, file);
    if (!error) buscarArquivos(leadId);
    setFazendoUpload(null);
  };

  const handleUploadFoto = async (leadId: number, e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    const file = e.target.files[0];
    const fileName = `perfil_${Date.now()}_${file.name.replace(/[^a-zA-Z0-9.]/g, '')}`;
    
    const { error } = await supabase.storage.from('dossies').upload(`${leadId}/${fileName}`, file);
    if (!error) {
      const { data } = supabase.storage.from('dossies').getPublicUrl(`${leadId}/${fileName}`);
      const url = data.publicUrl;
      setLeads(leads.map(l => l.id === leadId ? { ...l, foto_url: url } : l));
      await supabase.from('leads').update({ foto_url: url }).eq('id', leadId);
    } else {
      alert("Erro ao enviar foto: " + error.message);
    }
  };

  const buscarArquivos = async (leadId: number) => {
    const { data } = await supabase.storage.from('dossies').list(`${leadId}`);
    if (data) setArquivos(prev => ({ ...prev, [leadId]: data.filter(file => file.name !== '.emptyFolderPlaceholder' && !file.name.startsWith('perfil_')) }));
  };

  const baixarArquivo = async (leadId: number, fileName: string) => {
    const { data } = supabase.storage.from('dossies').getPublicUrl(`${leadId}/${fileName}`);
    window.open(data.publicUrl, '_blank');
  };

  const leadsFiltrados = leads.filter(lead => lead.nome.toLowerCase().includes(busca.toLowerCase()) || lead.servico.toLowerCase().includes(busca.toLowerCase()));
  const leadsEmProspeccao = leadsFiltrados.filter(lead => !lead.convertido);
  const clientesAtivos = leadsFiltrados.filter(lead => lead.convertido);

  const kpiClientes = leads.filter(l => l.convertido).length;
  const kpiAguardando = leads.filter(l => !l.contatado && !l.convertido).length;
  const kpiConversao = leads.length > 0 ? Math.round((kpiClientes / leads.length) * 100) : 0;
  
  const receitaRecorrente = clientesAtivos.reduce((total, c) => total + (Number(c.valor) || 0), 0);
  const receitaAvulsa = clientesAtivos.reduce((total, c) => total + (Number(c.valor_unico) || 0), 0);

  // ==========================================
  // NOVO GRÁFICO: PERFORMANCE DIÁRIA (ÚLTIMOS 15 DIAS)
  // ==========================================
  // 1. Gera a lista dos últimos 15 dias corridos
  const ultimos15Dias = Array.from({length: 15}).map((_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (14 - i));
    return d;
  });

  // 2. Acumula o faturamento real até cada um desses dias
  const dadosGrafico = ultimos15Dias.map(dataReferencia => {
    // Fim do dia para incluir tudo que foi fechado na data
    dataReferencia.setHours(23, 59, 59, 999); 
    
    const clientesAteEsseDia = clientesAtivos.filter(c => {
      // Se não tiver data de fechamento, usa a data de criação. Se não tiver nada, joga pra hoje.
      const dataDoCliente = new Date(c.data_fechamento || c.created_at || new Date().getTime());
      return dataDoCliente <= dataReferencia;
    });

    const mrrAcumulado = clientesAteEsseDia.reduce((acc, c) => acc + (Number(c.valor) || 0), 0);
    const avulsoAcumulado = clientesAteEsseDia.reduce((acc, c) => acc + (Number(c.valor_unico) || 0), 0);
    
    return {
      label: `${dataReferencia.getDate().toString().padStart(2, '0')}/${(dataReferencia.getMonth()+1).toString().padStart(2, '0')}`,
      mrr: mrrAcumulado,
      avulso: avulsoAcumulado
    };
  });

  // Compatibilidade: alias para nomes antigos usados em versões anteriores
  const grafData = dadosGrafico;

  const maxValorGrafico = Math.max(...dadosGrafico.map(d => Math.max(d.mrr, d.avulso)), 100); 
  const widthSvg = 600; const heightSvg = 180;
  
  const ptsMrr = dadosGrafico.map((d, i) => `${(i / (dadosGrafico.length - 1)) * widthSvg},${heightSvg - (d.mrr / maxValorGrafico) * heightSvg * 0.8}`).join(' ');
  const ptsAvulso = dadosGrafico.map((d, i) => `${(i / (dadosGrafico.length - 1)) * widthSvg},${heightSvg - (d.avulso / maxValorGrafico) * heightSvg * 0.8}`).join(' ');

  const IconeWhatsApp = () => (
    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
  );

  const IconeLixeira = () => (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
  );

  if (carregandoAuth) return <div className="flex h-screen items-center justify-center bg-slate-50 font-sans text-slate-500 font-medium">Carregando painel CTI...</div>;
  if (!sessao) {
    return (
      <div className="flex h-screen items-center justify-center bg-blue-950 font-sans p-4">
        <div className="bg-white p-8 rounded-3xl shadow-2xl w-full max-w-md">
          <div className="text-center mb-8"><div className="w-16 h-16 bg-blue-100 text-blue-900 rounded-full flex items-center justify-center mx-auto mb-4 text-2xl font-bold">CTI</div><h1 className="text-2xl font-bold text-slate-900">Acesso Restrito</h1></div>
          {erroLogin && <div className="mb-4 p-3 bg-red-50 text-red-600 rounded-lg text-sm text-center font-bold">{erroLogin}</div>}
          <form onSubmit={fazerLogin} className="space-y-4">
            <input type="email" required placeholder="E-mail corporativo" className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-900 text-slate-900 placeholder:text-slate-400" value={emailLogin} onChange={(e) => setEmailLogin(e.target.value)} />
            <input type="password" required placeholder="Senha" className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-900 text-slate-900 placeholder:text-slate-400" value={senhaLogin} onChange={(e) => setSenhaLogin(e.target.value)} />
            <button type="submit" className="w-full bg-blue-900 text-white font-bold py-4 rounded-xl shadow-lg hover:bg-blue-950 transition-colors">Entrar</button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className={`${isDarkMode ? 'dark' : ''}`}>
      <div className="flex h-screen bg-slate-50 dark:bg-slate-950 font-sans overflow-hidden transition-colors duration-300">
        <aside className="w-64 bg-blue-950 dark:bg-slate-900 text-white flex flex-col hidden md:flex rounded-r-[40px] shadow-2xl z-20 my-4 ml-4 overflow-hidden relative transition-colors duration-300">
          <div className="p-8 flex items-center gap-3"><div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center font-bold text-xl shadow-inner">C</div><h1 className="text-xl font-bold tracking-wide">CTI Contábil</h1></div>
          <nav className="flex-1 px-4 space-y-2 mt-4">
            <button onClick={() => setAbaAtiva('prospeccao')} className={`w-full flex items-center p-4 rounded-2xl font-semibold transition-all ${abaAtiva === 'prospeccao' ? 'bg-white text-blue-950 shadow-lg' : 'text-blue-100 hover:bg-white/10'}`}><span className="mr-3 text-lg">📊</span> Visão Geral</button>
            <button onClick={() => setAbaAtiva('clientes')} className={`w-full flex items-center p-4 rounded-2xl font-semibold transition-all ${abaAtiva === 'clientes' ? 'bg-white text-blue-950 shadow-lg' : 'text-blue-100 hover:bg-white/10'}`}><span className="mr-3 text-lg">💼</span> Clientes</button>
          </nav>
          <button onClick={fazerLogout} className="m-4 flex items-center justify-center p-4 rounded-2xl text-blue-200 hover:bg-red-500 hover:text-white transition-colors text-sm font-bold">🚪 Sair do Sistema</button>
        </aside>

        <main className="flex-1 flex flex-col h-screen overflow-hidden">
          <header className="p-6 sm:p-8 flex flex-col sm:flex-row justify-between items-center gap-6">
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-800 dark:text-white tracking-tight transition-colors capitalize">{abaAtiva === 'prospeccao' ? 'Centro de Comando' : 'Carteira de Clientes'}</h2>
            <div className="flex-1 max-w-xl relative w-full">
              <span className="absolute left-4 top-3.5 text-slate-400">🔍</span>
              <input type="text" placeholder="Pesquisar cliente ou serviço..." value={busca} onChange={(e) => setBusca(e.target.value)} className="w-full py-3 pl-12 pr-4 bg-white dark:bg-slate-900 dark:text-white dark:border-slate-800 rounded-full shadow-sm border border-slate-100 outline-none focus:ring-2 focus:ring-blue-900 transition-colors text-sm font-medium text-slate-900 placeholder:text-slate-400" />
            </div>
            <div className="flex md:hidden gap-2 w-full overflow-x-auto pb-2 scrollbar-hide">
              <button onClick={() => setAbaAtiva('prospeccao')} className={`flex-1 whitespace-nowrap px-4 py-2 text-sm font-bold rounded-lg ${abaAtiva === 'prospeccao' ? 'bg-blue-900 text-white' : 'bg-slate-200 text-slate-600'}`}>Visão Geral</button>
              <button onClick={() => setAbaAtiva('clientes')} className={`flex-1 whitespace-nowrap px-4 py-2 text-sm font-bold rounded-lg ${abaAtiva === 'clientes' ? 'bg-blue-900 text-white' : 'bg-slate-200 text-slate-600'}`}>Clientes</button>
            </div>
            <div className="flex items-center gap-4 w-full sm:w-auto justify-end">
              <button onClick={() => setIsDarkMode(!isDarkMode)} className="p-2.5 rounded-full bg-white dark:bg-slate-800 text-slate-600 dark:text-amber-400 shadow-sm border border-slate-100 dark:border-slate-700 hover:scale-110">{isDarkMode ? '☀️' : '🌙'}</button>
              <div className="flex items-center gap-3 bg-white dark:bg-slate-900 dark:border-slate-800 py-1.5 px-3 rounded-full shadow-sm border border-slate-100"><div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900 text-blue-900 dark:text-blue-100 flex items-center justify-center font-bold text-sm">A</div><span className="text-sm font-bold text-slate-700 dark:text-slate-200 hidden lg:block">Admin CTI</span></div>
            </div>
          </header>

          <div className="flex-1 overflow-auto px-6 sm:px-8 pb-8">
            
            {abaAtiva === 'prospeccao' && (
              <div className="space-y-8 animate-in fade-in duration-500">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                  <div className="bg-gradient-to-br from-blue-900 to-blue-800 p-6 rounded-3xl shadow-lg text-white relative overflow-hidden"><span className="text-blue-200 text-sm font-semibold mb-1 block">Mensal (MRR)</span><div className="text-3xl font-extrabold">R$ {receitaRecorrente.toLocaleString('pt-BR')}</div></div>
                  <div className="bg-gradient-to-br from-emerald-600 to-emerald-500 p-6 rounded-3xl shadow-lg text-white relative overflow-hidden"><span className="text-emerald-100 text-sm font-semibold mb-1 block">Avulsa (Única)</span><div className="text-3xl font-extrabold">R$ {receitaAvulsa.toLocaleString('pt-BR')}</div></div>
                  <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl shadow-sm border border-slate-200 dark:border-slate-800"><span className="text-slate-500 dark:text-slate-400 text-sm font-semibold">Conversão</span><div className="text-3xl font-extrabold text-slate-800 dark:text-white mt-2">{kpiConversao}%</div></div>
                  <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl shadow-sm border border-slate-200 dark:border-slate-800 border-l-4 border-l-amber-500"><span className="text-slate-500 dark:text-slate-400 text-sm font-semibold">Pendentes</span><div className="text-3xl font-extrabold text-slate-800 dark:text-white mt-2">{kpiAguardando}</div></div>
                </div>

                {/* GRÁFICO REAL DE PERFORMANCE DIÁRIA (15 DIAS) */}
                <div className="bg-white dark:bg-slate-900 p-6 sm:p-8 rounded-3xl shadow-sm border border-slate-200 dark:border-slate-800">
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
                    <div>
                      <h3 className="text-lg font-bold text-slate-800 dark:text-slate-200">Performance de Vendas (Últimos 15 dias)</h3>
                      <p className="text-xs text-slate-500 mt-1">Evolução real do faturamento baseada nos fechamentos</p>
                    </div>
                    <div className="flex gap-4 items-center">
                      <button onClick={reiniciarGrafico} className="text-xs font-bold text-slate-500 hover:text-red-500 flex items-center gap-1.5 bg-slate-100 dark:bg-slate-800 px-3 py-1.5 rounded-lg transition-colors border border-slate-200 dark:border-slate-700">
                        🔄 Zerar Gráfico
                      </button>
                      <div className="flex items-center gap-2 text-xs font-bold text-slate-500"><span className="w-3 h-1 rounded-full bg-blue-600"></span> MRR</div>
                      <div className="flex items-center gap-2 text-xs font-bold text-slate-500"><span className="w-3 h-1 rounded-full bg-emerald-500"></span> Avulso</div>
                    </div>
                  </div>
                  <div className="w-full h-[250px] relative">
                    <div className="absolute inset-0 flex flex-col justify-between border-b border-slate-200 dark:border-slate-700 pb-8">
                      <div className="border-b border-dashed border-slate-200 dark:border-slate-700 w-full h-0 opacity-50"></div>
                      <div className="border-b border-dashed border-slate-200 dark:border-slate-700 w-full h-0 opacity-50"></div>
                    </div>
                   <svg viewBox="-10 0 620 180" className="w-full h-full preserve-3d overflow-visible" preserveAspectRatio="none">
  {/* Linha MRR (Azul) */}
  <polyline points={ptsMrr} fill="none" stroke="#2563eb" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
  {dadosGrafico.map((v, i) => {
    const divisor = dadosGrafico.length > 1 ? dadosGrafico.length - 1 : 1;
    return (
      <circle 
        key={`mrr-${i}`} 
        cx={(i / divisor) * widthSvg} 
        cy={heightSvg - (v.mrr / maxValorGrafico) * heightSvg * 0.8} 
        r="5" 
        fill="#fff" 
        stroke="#2563eb" 
        strokeWidth="2" 
        className="dark:fill-slate-900" 
      />
    );
  })}

  {/* Linha Avulso (Verde) */}
  <polyline points={ptsAvulso} fill="none" stroke="#10b981" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
  {dadosGrafico.map((v, i) => {
    const divisor = dadosGrafico.length > 1 ? dadosGrafico.length - 1 : 1;
    return (
      <circle 
        key={`avulso-${i}`} 
        cx={(i / divisor) * widthSvg} 
        cy={heightSvg - (v.avulso / maxValorGrafico) * heightSvg * 0.8} 
        r="5" 
        fill="#fff" 
        stroke="#10b981" 
        strokeWidth="2" 
        className="dark:fill-slate-900" 
      />
    );
  })}
</svg>
                    <div className="absolute bottom-0 w-full flex justify-between text-[10px] font-bold text-slate-400 dark:text-slate-500 mt-2">
                      {dadosGrafico.map((m, i) => <span key={i} className="text-center">{m.label}</span>)}
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-bold text-slate-800 dark:text-slate-200 mb-4 ml-2">Pipeline de Prospecção</h3>
                  <div className="space-y-3">
                    {leadsEmProspeccao.length === 0 ? (
                      <div className="text-center p-8 text-slate-400 dark:text-slate-500 bg-white dark:bg-slate-900 rounded-3xl border border-dashed border-slate-300 dark:border-slate-700">Nenhum lead pendente.</div>
                    ) : (
                      leadsEmProspeccao.map((lead) => (
                        <div key={lead.id} className="bg-white dark:bg-slate-900 p-4 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 flex flex-col md:flex-row items-center justify-between gap-4 hover:shadow-md transition-all relative group">
                          
                          <button onClick={() => excluirLead(lead.id)} className="md:hidden absolute top-4 right-4 text-slate-300 hover:text-red-500 transition-colors p-2 rounded-full hover:bg-red-50 dark:hover:bg-slate-800" title="Excluir Lead">
                            <IconeLixeira />
                          </button>

                          <div className="flex items-center gap-4 w-full md:w-1/4">
                            <div className="w-12 h-12 rounded-full bg-blue-50 dark:bg-blue-900/50 text-blue-900 dark:text-blue-300 flex items-center justify-center font-bold text-lg border border-blue-100 dark:border-blue-800 shrink-0">
                              {lead.nome.charAt(0).toUpperCase()}
                            </div>
                            <div>
                              <p className="font-bold text-slate-900 dark:text-slate-100 text-sm">{lead.nome}</p>
                              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">{lead.whatsapp}</p>
                            </div>
                          </div>

                          <div className="w-full md:w-1/5 flex justify-center md:justify-start">
                            <span className="bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 py-1.5 px-4 rounded-full text-xs font-bold text-center">
                              {lead.servico}
                            </span>
                          </div>

                          <div className="flex justify-center gap-2 w-full md:w-1/4">
                            <button onClick={() => abrirWhatsApp(lead.nome, lead.whatsapp, lead.servico)} className="flex items-center justify-center gap-1.5 bg-green-500 hover:bg-green-600 text-white text-xs font-bold py-2.5 px-4 rounded-xl shadow-sm transition-colors"><IconeWhatsApp /> Whats</button>
                            {lead.email && <button onClick={() => abrirEmail(lead.nome, lead.email, lead.servico)} className="flex items-center justify-center gap-1.5 bg-slate-800 hover:bg-slate-900 text-white text-xs font-bold py-2.5 px-4 rounded-xl shadow-sm transition-colors">✉️ E-mail</button>}
                          </div>

                          <div className="flex items-center justify-between md:justify-end gap-4 w-full md:w-1/4">
                            <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-slate-500 dark:text-slate-400"><input type="checkbox" checked={lead.contatado} onChange={() => toggleContatado(lead.id, lead.contatado)} className="w-4 h-4 accent-blue-900" />Contatado</label>
                            <button onClick={() => toggleConvertido(lead.id, lead.convertido)} disabled={!lead.contatado} className="bg-blue-900 dark:bg-blue-600 disabled:bg-slate-200 text-white text-xs font-bold py-2 px-4 rounded-xl shadow-sm hover:bg-blue-950">+ Cliente</button>
                            <button onClick={() => excluirLead(lead.id)} className="hidden md:flex text-slate-300 hover:text-red-500 transition-colors p-2 rounded-full hover:bg-red-50 dark:hover:bg-slate-800" title="Excluir Lead">
                              <IconeLixeira />
                            </button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            )}

            {abaAtiva === 'clientes' && (
               <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6 animate-in fade-in duration-500">
                 {clientesAtivos.map((cliente) => (
                     <div key={cliente.id} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-3xl shadow-sm hover:shadow-xl transition-all flex flex-col overflow-hidden relative">
                       <div className="h-2 w-full bg-blue-900 dark:bg-blue-600"></div>
                       
                       <div className="p-6 flex-1 flex flex-col">
                         <div className="flex items-start gap-4 w-full mb-4">
                           <div className="flex flex-col items-center shrink-0 w-20">
                             <div className="relative w-16 h-16 rounded-full overflow-hidden bg-blue-50 dark:bg-blue-900/50 group border-2 border-slate-100 dark:border-slate-700 shadow-sm">
                               {cliente.foto_url ? (
                                 <img src={cliente.foto_url} alt={cliente.nome} className="w-full h-full object-cover" />
                               ) : (
                                 <div className="w-full h-full flex items-center justify-center text-2xl font-bold text-blue-900 dark:text-blue-300">
                                   {cliente.nome.charAt(0).toUpperCase()}
                                 </div>
                               )}
                               <label className="absolute inset-0 bg-black/50 text-white text-[10px] font-bold flex items-center justify-center opacity-0 group-hover:opacity-100 cursor-pointer transition-opacity">
                                 + Foto
                                 <input type="file" className="hidden" accept="image/*" onChange={(e) => handleUploadFoto(cliente.id, e)} />
                               </label>
                             </div>
                           </div>
                           
                           <div className="flex-1 flex flex-col w-full">
                             <div className="flex flex-col items-start mb-2">
                               <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100 leading-tight">{cliente.nome}</h3>
                               <span className="inline-block mt-1 bg-blue-50 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 text-[10px] font-bold px-2.5 py-1 rounded-full">{cliente.servico}</span>
                             </div>
                             <textarea 
                               className="w-full flex-1 min-h-[70px] p-3 border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 rounded-2xl text-xs outline-none resize-none text-slate-900 dark:text-slate-100 placeholder:text-slate-400" 
                               placeholder="Anotações e descrição..." 
                               value={cliente.notas} 
                               onBlur={(e) => atualizarNotas(cliente.id, e.target.value)} 
                               onChange={(e) => setLeads(leads.map(l => l.id === cliente.id ? { ...l, notas: e.target.value } : l))}
                             ></textarea>
                           </div>
                         </div>

                         <div className="grid grid-cols-2 gap-3 mb-4">
                           <div className="bg-blue-50/50 dark:bg-slate-950 p-3 rounded-xl border border-blue-100 dark:border-slate-800"><label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">MRR</label><div className="flex items-center gap-1 mt-1"><span className="text-slate-400 text-sm font-bold">R$</span><input type="number" className="w-full bg-transparent text-slate-900 dark:text-blue-400 font-bold outline-none text-sm" value={cliente.valor || ''} onChange={(e) => setLeads(leads.map(l => l.id === cliente.id ? { ...l, valor: Number(e.target.value) } : l))} onBlur={(e) => atualizarValorMensal(cliente.id, e.target.value)} /></div></div>
                           <div className="bg-emerald-50/50 dark:bg-slate-950 p-3 rounded-xl border border-emerald-100 dark:border-slate-800"><label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Único</label><div className="flex items-center gap-1 mt-1"><span className="text-slate-400 text-sm font-bold">R$</span><input type="number" className="w-full bg-transparent text-slate-900 dark:text-emerald-400 font-bold outline-none text-sm" value={cliente.valor_unico || ''} onChange={(e) => setLeads(leads.map(l => l.id === cliente.id ? { ...l, valor_unico: Number(e.target.value) } : l))} onBlur={(e) => atualizarValorUnico(cliente.id, e.target.value)} /></div></div>
                         </div>
                         
                         <div className="pt-4 mt-auto border-t border-slate-100 dark:border-slate-800">
                           <div className="flex justify-between items-center mb-2"><label className="text-xs font-bold text-slate-400 uppercase">📎 Dossiê</label><label className="cursor-pointer text-xs bg-slate-100 text-slate-700 px-3 py-1 rounded-full font-bold">{fazendoUpload === cliente.id ? '...' : '+ Anexar'}<input type="file" className="hidden" onChange={(e) => handleUpload(cliente.id, e)} disabled={fazendoUpload === cliente.id} /></label></div>
                           <div className="space-y-2 max-h-24 overflow-y-auto pr-1">{arquivos[cliente.id]?.map((arq, idx) => (<div key={idx} className="flex justify-between items-center p-2 bg-slate-50 dark:bg-slate-950 rounded-xl text-sm"><span className="truncate w-3/4 text-slate-600 dark:text-slate-400 text-xs font-medium">{arq.name}</span><button onClick={() => baixarArquivo(cliente.id, arq.name)} className="text-blue-700 dark:text-blue-400 font-bold text-xs">Abrir</button></div>))}</div>
                         </div>
                       </div>
                       <div className="p-4 bg-slate-50 dark:bg-slate-950/50 border-t border-slate-100 dark:border-slate-800 flex justify-between items-center">
                         <div className="flex gap-2">
                            <button onClick={() => abrirWhatsApp(cliente.nome, cliente.whatsapp, cliente.servico)} className="flex items-center justify-center w-9 h-9 bg-green-500 hover:bg-green-600 text-white rounded-xl shadow-sm"><IconeWhatsApp /></button>
                            <button onClick={() => setModalProposta(cliente)} className="bg-blue-900 dark:bg-blue-600 hover:bg-blue-950 text-white text-xs font-bold py-2 px-4 rounded-xl shadow-sm">Nova Proposta</button>
                         </div>
                         <button onClick={() => toggleConvertido(cliente.id, cliente.convertido)} className="text-xs font-bold text-slate-400 hover:text-red-500">Desativar</button>
                       </div>
                     </div>
                 ))}
               </div>
            )}
          </div>

          {modalProposta && (
            <div className="absolute inset-0 z-50 flex items-center justify-center bg-slate-900/60 dark:bg-black/80 backdrop-blur-md p-4 transition-all">
              <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl w-full max-w-4xl overflow-hidden animate-in zoom-in-95 duration-300 flex flex-col max-h-[90vh]">
                <div className="bg-blue-950 p-5 flex justify-between items-center text-white border-b border-blue-900">
                  <div className="flex items-center gap-3"><span className="bg-blue-900 p-2 rounded-xl">📄</span><div><h3 className="font-bold text-lg leading-tight">Criar Proposta Comercial</h3><p className="text-blue-300 text-xs">Para: {modalProposta.nome}</p></div></div>
                  <button onClick={() => setModalProposta(null)} className="hover:text-red-400 transition-colors p-2 text-xl">&times;</button>
                </div>
                <div className="flex flex-col md:flex-row flex-1 overflow-auto">
                  <div className="w-full md:w-1/2 p-6 md:p-8 space-y-5 border-r border-slate-100 dark:border-slate-800 overflow-y-auto">
                    <div><label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Escopo do Serviço</label><textarea rows={4} placeholder="Descreva os entregáveis..." className="w-full p-4 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl outline-none focus:ring-2 focus:ring-blue-600 text-sm resize-none transition-all text-slate-900 dark:text-white placeholder:text-slate-400" value={dadosProposta.escopo} onChange={(e) => setDadosProposta({...dadosProposta, escopo: e.target.value})}></textarea></div>
                    <div className="grid grid-cols-2 gap-4">
                      <div><label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Valor (R$)</label><input type="text" placeholder="Ex: 500,00" className="w-full p-4 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl outline-none focus:ring-2 focus:ring-blue-600 text-sm font-semibold text-slate-900 dark:text-white placeholder:text-slate-400" value={dadosProposta.valor} onChange={(e) => setDadosProposta({...dadosProposta, valor: e.target.value})}/></div>
                      <div><label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Prazo / Condições</label><input type="text" placeholder="Ex: Mensal, Pix..." className="w-full p-4 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl outline-none focus:ring-2 focus:ring-blue-600 text-sm text-slate-900 dark:text-white placeholder:text-slate-400" value={dadosProposta.prazo} onChange={(e) => setDadosProposta({...dadosProposta, prazo: e.target.value})}/></div>
                    </div>
                  </div>
                  <div className="w-full md:w-1/2 bg-slate-50 dark:bg-slate-950 p-6 md:p-8 flex flex-col">
                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-4 flex items-center gap-2"><IconeWhatsApp /> Pré-visualização</label>
                    <div className="flex-1 bg-[#E5DDD5] dark:bg-[#0b141a] rounded-2xl p-4 shadow-inner relative overflow-hidden">
                      <div className="absolute inset-0 opacity-[0.03] dark:opacity-10 bg-[url('https://i.pinimg.com/736x/8c/98/99/8c98994518b575bfd8c949e91d20548b.jpg')] bg-cover"></div>
                      <div className="relative bg-[#d9fdd3] dark:bg-[#005c4b] text-[#111b21] dark:text-[#e9edef] p-4 rounded-b-xl rounded-tr-xl shadow-sm text-sm whitespace-pre-wrap ml-auto max-w-[90%] border border-green-200/50 dark:border-none">
                        {gerarTextoProposta()}
                        <span className="block text-right text-[10px] text-green-800/60 dark:text-white/50 mt-1">Agora</span>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="p-4 border-t border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900">
                  <button onClick={enviarPropostaWhatsApp} className="w-full bg-green-500 hover:bg-green-600 text-white font-bold py-4 rounded-2xl flex items-center justify-center gap-2 shadow-lg transition-all hover:scale-[1.01]">
                    <IconeWhatsApp /> Enviar Proposta para {modalProposta.nome}
                  </button>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}