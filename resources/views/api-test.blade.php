<!DOCTYPE html>
<html>
<head>
    <title>Laravel API Test</title>
    <meta name="csrf-token" content="{{ csrf_token() }}">
    <link rel="stylesheet" href="/css/api-test.css">
</head>
<body>
    <h1>Laravel API Integration Test</h1>
    <p>This page tests the Laravel API endpoints to verify the backend is working correctly.</p>

    <button id="runAllTests">Run All Tests</button>
    <button id="clearResults">Clear Results</button>

    <div id="results"></div>

    <script src="/js/api-test.js"></script>
</body>
</html>
