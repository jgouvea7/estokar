"use client";

import Link from 'next/link';
import { ChevronLeft, Mail } from 'lucide-react';

export default function PublicContactPage() {
    return (
        <div className="min-h-screen flex flex-col bg-gradient-to-br from-slate-50 to-blue-50/30">
            <header className="border-b border-slate-200 bg-white/80 backdrop-blur-sm">
                <nav className="mx-auto flex max-w-[1120px] items-center justify-between px-6 py-4 sm:px-8">
                    <Link href="/" className="flex items-center gap-2 text-slate-900 hover:text-slate-600 transition-colors font-semibold">
                        <ChevronLeft size={20} />
                        Voltar
                    </Link>
                </nav>
            </header>

            <main className="flex-1 mx-auto max-w-3xl w-full px-6 py-12 sm:px-8">
                <article className="space-y-8">
                    <div className="space-y-3 text-center mb-12">
                        <div className="flex justify-center mb-4">
                            <div className="grid h-14 w-14 place-items-center rounded-2xl bg-blue-100 text-blue-600">
                                <Mail size={28} />
                            </div>
                        </div>
                        <h1 className="text-4xl font-black text-slate-900">Contato</h1>
                        <p className="text-base text-slate-600">
                            Feedback, sugestões e suporte
                        </p>
                    </div>

                    <section className="rounded-3xl border border-slate-200 bg-white p-8 space-y-8 text-slate-700 shadow-sm hover:shadow-md transition-shadow">

                        <div className="space-y-4 pb-8 border-b border-slate-200">
                            <h2 className="text-2xl font-black text-slate-900">Feedback & Suporte</h2>

                            <p className="leading-relaxed">
                                Encontrou algum problema ou tem uma ideia de funcionalidade?
                            </p>

                            <p className="leading-relaxed">
                                Você pode enviar sugestões de melhorias, reportar bugs ou tirar dúvidas sobre o uso do Estokar.
                                Seu feedback é essencial para evoluirmos o produto continuamente.
                            </p>

                            <p className="font-semibold text-slate-900">
                                jonnathasg@gmail.com
                            </p>

                            <p className="text-sm text-slate-500">
                                Para um atendimento mais rápido, inclua o máximo de detalhes possível (ex: o que aconteceu, prints, dispositivo utilizado).
                            </p>
                        </div>

                        <div className="space-y-4">
                            <h2 className="text-2xl font-black text-slate-900">Tempo de resposta</h2>
                            <p className="leading-relaxed">
                                Respondemos normalmente em até 24 horas úteis.
                            </p>
                        </div>

                    </section>

                    <div className="mt-12 text-center space-y-4 py-8 border-t border-slate-200">
                        <p className="text-slate-600">Documentos úteis:</p>
                        <div className="flex flex-wrap gap-4 justify-center">
                            <Link
                                href="/privacy"
                                className="inline-flex items-center gap-2 rounded-lg bg-slate-100 px-4 py-2 text-sm font-semibold text-slate-900 hover:bg-slate-200"
                            >
                                Política de Privacidade
                            </Link>
                        </div>
                    </div>
                </article>
            </main>

            <footer className="border-t border-slate-200 bg-slate-50/50 py-6">
                <div className="mx-auto max-w-[1120px] flex flex-col items-center justify-center gap-2 px-6 text-center text-xs text-slate-600 sm:px-8">
                    <p>© 2026 Estokar - Inventory OS. Todos os direitos reservados.</p>
                </div>
            </footer>
        </div>
    );
}