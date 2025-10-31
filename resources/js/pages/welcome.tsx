import { dashboard, login, register } from '@/routes';
import { type SharedData } from '@/types';
import { Head, Link, usePage } from '@inertiajs/react';

export default function Welcome() {
    const { auth } = usePage<SharedData>().props;

    return (
        <>
            <Head title="Alien Care Autoshop">
                <link rel="preconnect" href="https://fonts.bunny.net" />
                <link href="https://fonts.bunny.net/css?family=instrument-sans:400,500,600" rel="stylesheet" />
            </Head>
            <div className="flex min-h-screen flex-col items-center overflow-x-hidden bg-gradient-to-br from-[#242424] to-[#000000] p-6 text-[#EDEDEC] lg:justify-center lg:p-8">
                {/* Spotlight Effect */}
                <div className="pointer-events-none absolute top-0 left-1/2 z-0 h-screen w-full max-w-full -translate-x-1/2 overflow-hidden">
                    <div className="bg-gradient-radial absolute top-0 left-1/2 h-64 w-[1603px] max-w-[200vw] -translate-x-1/2 rounded-full from-yellow-200/25 via-yellow-100/15 to-transparent blur-3xl"></div>
                    <div
                        className="absolute top-0 left-1/2 h-[600px] w-[1283px] max-w-[200vw] -translate-x-1/2 bg-gradient-to-b from-yellow-300/35 via-yellow-100/8 via-yellow-200/15 to-transparent blur-2xl"
                        style={{ clipPath: 'polygon(32% 0%, 68% 0%, 80% 100%, 20% 100%)' }}
                    ></div>
                </div>

                <header className="relative z-10 mb-6 w-full px-8 text-sm not-has-[nav]:hidden lg:px-16">
                    <nav className="flex items-center justify-between rounded-lg bg-[#625959]/20 px-6 py-4 backdrop-blur-md">
                        <div className="flex items-center gap-10">
                            {/* Logo */}
                            <Link href="/" className="flex items-center">
                                <img src="/images/iconlogo.svg" alt="AlienCare Auto Shop Logo" className="h-10 w-auto" />
                            </Link>
                            {/* Center Navigation Links */}
                            <Link href="/" className="text-sm leading-normal text-[#EDEDEC] hover:text-[#D9AF01]">
                                Home
                            </Link>
                            <Link href="/about" className="text-sm leading-normal text-[#EDEDEC] hover:text-[#D9AF01]">
                                About Us
                            </Link>
                            <Link href="/services" className="text-sm leading-normal text-[#EDEDEC] hover:text-[#D9AF01]">
                                Services
                            </Link>
                            <Link href="/faqs" className="text-sm leading-normal text-[#EDEDEC] hover:text-[#D9AF01]">
                                FAQs
                            </Link>
                        </div>

                        {/* Right Side - Auth Links */}
                        <div className="flex items-center gap-4">
                            {auth.user ? (
                                <Link
                                    href={dashboard()}
                                    className="inline-block rounded-sm border border-[#EDEDEC]/30 px-5 py-1.5 text-sm leading-normal text-[#EDEDEC] hover:border-[#D9AF01]"
                                >
                                    Dashboard
                                </Link>
                            ) : (
                                <>
                                    <Link
                                        href={login()}
                                        className="inline-block rounded-sm border border-[#EDEDEC]/30 px-5 py-1.5 text-sm leading-normal font-bold text-[#EDEDEC] hover:border-[#D9AF01]"
                                    >
                                        Log in
                                    </Link>
                                    <Link
                                        href={register()}
                                        className="inline-block rounded-sm bg-[#D9AF01] px-5 py-1.5 text-sm leading-normal font-bold text-[#1b1b18] hover:bg-[#c29d01]"
                                    >
                                        Sign up
                                    </Link>
                                </>
                            )}
                        </div>
                    </nav>
                </header>

                <main className="relative z-10 w-full max-w-[335px] lg:max-w-4xl">
                    <div className="relative flex flex-col items-center justify-center gap-8">
                        {/* Word logo */}
                        <div className="relative z-10 mt-8 w-full max-w-sm">
                            <img src="/images/wordlogo.svg" alt="Word Logo" className="h-auto w-full drop-shadow-2xl" />
                        </div>
                        {/* Text Content */}
                        <div className="relative z-10 text-center">
                            <p className="text-lg text-gray-300">
                                Your car deserves more than just a tune-up it deserves cosmic-level care. Discover why AlienCare Autoshop is the
                                trusted pit stop for drivers who want the best
                            </p>
                        </div>
                        {/* Car Image */}
                        <div className="relative z-10 -mt-6 w-full max-w-md">
                            <img src="/images/hondacar.png" alt="Auto Shop Car" className="h-auto w-full" />
                        </div>
                    </div>
                </main>

                <div className="hidden h-14.5 lg:block"></div>
            </div>
        </>
    );
}
