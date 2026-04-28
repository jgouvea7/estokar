"use client";

import Link from 'next/link';
import { ChevronLeft, Info } from 'lucide-react';

export default function PublicAboutPage() {
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
                                <Info size={28} />
                            </div>
                        </div>
                        <h1 className="text-4xl font-black text-slate-900">Sobre o Estokar</h1>
                        <p className="text-base text-slate-600">
                            Um projeto acadêmico focado em aprendizado e experimentação
                        </p>
                    </div>

                    <section className="rounded-3xl border border-slate-200 bg-white p-8 space-y-8 text-slate-700 shadow-sm hover:shadow-md transition-shadow">

                        <div className="space-y-4 pb-8 border-b border-slate-200">
                            <h2 className="text-2xl font-black text-slate-900">Sobre o projeto</h2>
                            <p className="leading-relaxed">
                                O Estokar é um projeto desenvolvido no contexto acadêmico, com o objetivo de aplicar na prática
                                conceitos de desenvolvimento de software, arquitetura, segurança e integração de sistemas.
                            </p>
                            <p className="leading-relaxed">
                                A plataforma serve como um ambiente de aprendizado e experimentação, evoluindo continuamente
                                conforme novas tecnologias e ideias são exploradas.
                            </p>
                        </div>

                        <div className="space-y-4 pb-8 border-b border-slate-200">
                            <h2 className="text-2xl font-black text-slate-900">Objetivo</h2>
                            <p className="leading-relaxed">
                                O principal objetivo do Estokar é simular uma aplicação real de gestão de estoque,
                                permitindo a prática de funcionalidades como controle de produtos, movimentações
                                e organização de dados.
                            </p>
                        </div>

                        <div className="space-y-4 pb-8 border-b border-slate-200">
                            <h2 className="text-2xl font-black text-slate-900">Uso e custos</h2>
                            <p className="leading-relaxed">
                                O Estokar é totalmente gratuito e não possui fins comerciais no momento.
                                Nenhuma cobrança é realizada pelo uso da plataforma.
                            </p>
                            <p className="leading-relaxed">
                                Por se tratar de um projeto em desenvolvimento, algumas funcionalidades podem mudar,
                                apresentar instabilidades ou ser descontinuadas sem aviso prévio.
                            </p>
                        </div>

                        <div className="space-y-4">
                            <h2 className="text-2xl font-black text-slate-900">Responsabilidade</h2>
                            <p className="leading-relaxed">
                                O sistema é fornecido "como está", sem garantias de disponibilidade contínua ou adequação
                                para uso em ambientes críticos ou comerciais.
                            </p>
                            <p className="leading-relaxed">
                                Recomenda-se não utilizar o Estokar como única fonte de controle para operações importantes.
                            </p>
                        </div>

                    </section>

                    <div className="mt-12 text-center space-y-4 py-8 border-t border-slate-200">
                        <p className="text-slate-600">Dúvidas ou feedback?</p>
                        <div className="flex flex-wrap gap-4 justify-center">
                            <Link
                                href="/contact"
                                className="inline-flex items-center gap-2 rounded-lg bg-slate-100 px-4 py-2 text-sm font-semibold text-slate-900 hover:bg-slate-200"
                            >
                                Entrar em contato
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