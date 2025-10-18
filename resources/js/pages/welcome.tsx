import { dashboard, login, register } from '@/routes';
import { type SharedData } from '@/types';
import { Head, Link, usePage } from '@inertiajs/react';

export default function Welcome() {
    const { auth } = usePage<SharedData>().props;

    return (
        <>
            <Head title="Welcome">
                <link rel="preconnect" href="https://fonts.bunny.net" />
                <link href="https://fonts.bunny.net/css?family=instrument-sans:400,500,600" rel="stylesheet" />
            </Head>
            <div className="flex min-h-screen flex-col items-center bg-[#FDFDFC] p-6 text-[#1b1b18] lg:justify-center lg:p-8 dark:bg-[#0a0a0a]">
                <header className="mb-6 w-full px-8 text-sm not-has-[nav]:hidden lg:px-16">
                    <nav className="flex items-center justify-between">
                        <div className="flex items-center gap-10">
                            {/* Logo */}
                            <Link href="/" className="flex items-center">
                                <img src="/images/ICON-LOGO.svg" alt="AlienCare Auto Shop Logo" className="h-10 w-auto" />
                            </Link>
                            {/* Center Navigation Links */}
                            <Link
                                href="/"
                                className="text-sm leading-normal text-[#1b1b18] hover:text-[#19140080] dark:text-[#EDEDEC] dark:hover:text-[#62605b]"
                            >
                                Home
                            </Link>
                            <Link
                                href="/about"
                                className="text-sm leading-normal text-[#1b1b18] hover:text-[#19140080] dark:text-[#EDEDEC] dark:hover:text-[#62605b]"
                            >
                                About Us
                            </Link>
                            <Link
                                href="/services"
                                className="text-sm leading-normal text-[#1b1b18] hover:text-[#19140080] dark:text-[#EDEDEC] dark:hover:text-[#62605b]"
                            >
                                Services
                            </Link>
                            <Link
                                href="/faqs"
                                className="text-sm leading-normal text-[#1b1b18] hover:text-[#19140080] dark:text-[#EDEDEC] dark:hover:text-[#62605b]"
                            >
                                FAQs
                            </Link>
                        </div>

                        {/* Right Side - Auth Links */}
                        <div className="flex items-center gap-4">
                            {auth.user ? (
                                <Link
                                    href={dashboard()}
                                    className="inline-block rounded-sm border border-[#19140035] px-5 py-1.5 text-sm leading-normal text-[#1b1b18] hover:border-[#1915014a] dark:border-[#3E3E3A] dark:text-[#EDEDEC] dark:hover:border-[#62605b]"
                                >
                                    Dashboard
                                </Link>
                            ) : (
                                <>
                                    <Link
                                        href={login()}
                                        className="inline-block rounded-sm border border-[#19140035] px-5 py-1.5 text-sm leading-normal font-bold text-[#1b1b18] hover:border-[#1915014a] dark:border-[#3E3E3A] dark:text-[#EDEDEC] dark:hover:border-[#62605b]"
                                    >
                                        Log in
                                    </Link>
                                    <Link
                                        href={register()}
                                        className="inline-block rounded-sm bg-[#D9AF01] px-5 py-1.5 text-sm leading-normal font-bold text-[#1b1b18] hover:bg-[#c29d01] dark:text-[#1b1b18]"
                                    >
                                        Sign up
                                    </Link>
                                </>
                            )}
                        </div>
                    </nav>
                </header>

                <main className="w-full max-w-[335px] lg:max-w-4xl">
                    <div className="flex flex-col items-center justify-center gap-8">
                        {/* Car Image */}
                        <div className="w-full max-w-2xl">
                            <img src="/images/LandingpageCar-bgremoved.png" alt="Auto Shop Car" className="h-auto w-full" />
                        </div>

                        {/* Welcome Content */}
                        <div className="text-center">
                            <h1 className="mb-4 text-4xl font-bold dark:text-[#EDEDEC]">Welcome to AlienCare Auto Shop</h1>
                            <p className="text-lg text-gray-600 dark:text-gray-400">Your trusted partner for automotive care and maintenance</p>
                        </div>
                    </div>
                </main>

                <div className="hidden h-14.5 lg:block"></div>
            </div>
        </>
    );
}
