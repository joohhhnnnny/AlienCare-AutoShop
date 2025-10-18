<!DOCTYPE html>
<html>
<head>
    <title>Laravel API Test</title>
    <meta name="csrf-token" content="{{ csrf_token() }}">
    @vite(['resources/css/app.css'])
</head>
<body class="font-sans antialiased bg-background text-foreground p-5">
    <h1 class="text-3xl font-bold mb-4">Laravel API Integration Test</h1>
    <p class="text-base mb-4">This page tests the Laravel API endpoints to verify the backend is working correctly.</p>

    <div class="flex gap-2 mb-6">
        <button id="runAllTests" class="bg-primary text-primary-foreground hover:bg-primary/90 px-4 py-2 rounded font-medium cursor-pointer transition">
            Run All Tests
        </button>
        <button id="clearResults" class="bg-secondary text-secondary-foreground hover:bg-secondary/90 px-4 py-2 rounded font-medium cursor-pointer transition">
            Clear Results
        </button>
    </div>

    <div id="results" class="space-y-4"></div>

    <script src="/js/api-test.js"></script>
</body>
</html>
