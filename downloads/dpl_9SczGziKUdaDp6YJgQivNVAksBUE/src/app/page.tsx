"use client";
import { useState } from "react";
import { supabase } from "../lib/supabase";

export default function Home() {
  const [formData, setFormData] = useState({ nome: "", whatsapp: "", email: "", servico: "" });
  const [enviando, setEnviando] = useState(false);
  const [sucesso, setSucesso] = useState(false); 

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setEnviando(true);
    const { error } = await supabase.from('leads').insert([{ nome: formData.nome, whatsapp: formData.whatsapp, email: formData.email, servico: formData.servico }]);
    setEnviando(false);
    if (error) alert("Erro ao enviar dados. Tente novamente.");
    else setSucesso(true); 
  };

  const avaliacoes = [
    { nome: "Carlos Eduardo", empresa: "Agência Digital", texto: "A migração para a CTI foi a melhor escolha. Resolveram pendências de anos em semanas.", estrelas: 5 },
    { nome: "Mariana Souza", empresa: "Clínica Médica", texto: "Finalmente entendo meus impostos. O atendimento no WhatsApp é extremamente rápido e eficiente.", estrelas: 5 },
  ];

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center p-4 sm:p-6 font-sans">
      <div className={`bg-white rounded-3xl shadow-2xl w-full overflow-hidden border border-white/50 transition-all duration-500 ${sucesso ? 'max-w-3xl' : 'max-w-md'}`}>
        
        <div className="bg-blue-950 p-8 text-center relative overflow-hidden">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full bg-gradient-to-b from-white/10 to-transparent pointer-events-none"></div>
          <div className="relative z-10">
            <div className="w-16 h-16 bg-white/10 backdrop-blur-sm rounded-2xl flex items-center justify-center mx-auto mb-4 border border-white/20">
              <span className="text-2xl font-bold text-white tracking-wider">CTI</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-wide mb-1">CTI Contabilidade</h1>
            <p className="text-blue-200 text-sm font-medium">Inteligência e segurança para o seu negócio</p>
          </div>
        </div>

        <div className="p-6 sm:p-8 flex flex-col justify-center">
          {sucesso ? (
            <div className="animate-in fade-in zoom-in duration-700">
              <div className="text-center mb-8">
                <div className="w-20 h-20 bg-emerald-50 rounded-full flex items-center justify-center mx-auto mb-4 border border-emerald-100 shadow-sm">
                  <svg className="w-10 h-10 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                </div>
                <h2 className="text-2xl sm:text-3xl font-bold text-slate-800 mb-2">Proposta Encaminhada!</h2>
                <p className="text-slate-600 text-sm sm:text-base max-w-xl mx-auto">
                  Olá, <strong>{formData.nome}</strong>! Nossa equipe já recebeu sua solicitação sobre <strong>{formData.servico}</strong>. Entraremos em contato via WhatsApp em breve.
                </p>
              </div>

              <div className="border-t border-slate-100 pt-8 mt-4">
                <div className="text-center mb-6">
                  <span className="text-xs font-bold text-blue-600 bg-blue-50 px-3 py-1.5 rounded-full uppercase tracking-wider">O que dizem sobre nós</span>
                  <h3 className="text-xl font-bold text-slate-800 mt-4">Junte-se a dezenas de empresas seguras</h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {avaliacoes.map((av, idx) => (
                    <div key={idx} className="bg-slate-50 border border-slate-100 p-5 rounded-2xl flex flex-col justify-between">
                      <div>
                        <div className="flex text-amber-400 mb-3 gap-1 text-sm">{Array.from({ length: av.estrelas }).map((_, i) => <span key={i}>★</span>)}</div>
                        <p className="text-slate-600 text-sm italic leading-relaxed mb-4">"{av.texto}"</p>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-blue-900 text-white flex items-center justify-center font-bold text-xs">{av.nome.charAt(0)}</div>
                        <div>
                          <p className="text-xs font-bold text-slate-800">{av.nome}</p>
                          <p className="text-[10px] text-slate-500 uppercase tracking-wide">{av.empresa}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="animate-in fade-in duration-500">
              <div className="text-center mb-6">
                <h2 className="text-xl font-bold text-slate-800">Solicite um Diagnóstico</h2>
                <p className="text-sm text-slate-500 mt-1">Preencha os dados abaixo e fale com um especialista.</p>
              </div>
              <form onSubmit={handleSubmit} className="space-y-4">
                {/* ADICIONADO text-slate-900 EM TODOS OS INPUTS */}
                <div><label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1 ml-1">Nome ou Empresa *</label><input type="text" required placeholder="Como devemos chamar você?" className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-blue-900 outline-none transition-all text-sm text-slate-900 placeholder:text-slate-400 font-medium" value={formData.nome} onChange={(e) => setFormData({...formData, nome: e.target.value})} /></div>
                <div><label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1 ml-1">WhatsApp *</label><input type="tel" required placeholder="(00) 00000-0000" className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-blue-900 outline-none transition-all text-sm text-slate-900 placeholder:text-slate-400 font-medium" value={formData.whatsapp} onChange={(e) => setFormData({...formData, whatsapp: e.target.value})} /></div>
                <div><label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1 ml-1">E-mail Profissional <span className="text-slate-400 font-normal lowercase">(opcional)</span></label><input type="email" placeholder="seu@email.com" className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-blue-900 outline-none transition-all text-sm text-slate-900 placeholder:text-slate-400 font-medium" value={formData.email} onChange={(e) => setFormData({...formData, email: e.target.value})} /></div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1 ml-1">Qual a sua necessidade? *</label>
                  <select required className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-blue-900 outline-none transition-all text-sm text-slate-900 font-medium cursor-pointer" value={formData.servico} onChange={(e) => setFormData({...formData, servico: e.target.value})}>
                    <option value="" className="text-slate-400">Selecione um serviço...</option>
                    <option value="Abertura de Empresa">Abertura de Empresa</option>
                    <option value="Troca de Contador">Troca de Contador (Migração)</option>
                    <option value="Assessoria Mensal">Assessoria Contábil Mensal</option>
                    <option value="Imposto de Renda">Imposto de Renda</option>
                    <option value="Outros">Outra dúvida / Consultoria</option>
                  </select>
                </div>
                <button type="submit" disabled={enviando} className="w-full bg-blue-900 text-white font-bold py-4 rounded-2xl hover:bg-blue-950 transition-all shadow-lg hover:shadow-xl hover:-translate-y-0.5 mt-2">
                  {enviando ? 'Enviando...' : 'Falar com um Especialista'}
                </button>
              </form>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}