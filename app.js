const express = require('express');
const puppeteer = require('puppeteer');

const app = express();
const port = 3000;

app.get('/', (req, res) => {
    res.send(`
        <html lang="pt-BR">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Detector de Gateways</title>
            <style>
                body {
                    font-family: Arial, sans-serif;
                    background-color: #f4f4f9;
                    margin: 0;
                    padding: 0;
                }
                .container {
                    max-width: 600px;
                    margin: 50px auto;
                    padding: 20px;
                    background: #fff;
                    box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
                    border-radius: 8px;
                }
                h1 {
                    text-align: center;
                    color: #333;
                }
                input {
                    width: 100%;
                    padding: 10px;
                    margin: 10px 0;
                    border: 1px solid #ccc;
                    border-radius: 4px;
                }
                button {
                    width: 100%;
                    padding: 10px;
                    background-color: #007bff;
                    color: #fff;
                    border: none;
                    border-radius: 4px;
                    font-size: 16px;
                    cursor: pointer;
                    transition: background-color 0.3s ease;
                }
                button:hover {
                    background-color: #0056b3;
                }
                .result {
                    margin-top: 20px;
                    padding: 10px;
                    background-color: #e9ecef;
                    border-radius: 4px;
                    text-align: center;
                    color: #333;
                }
                .captcha-status {
                    margin-top: 20px;
                    padding: 10px;
                    background-color: #ffcccc;
                    border-radius: 4px;
                    text-align: center;
                    color: #cc0000;
                    font-weight: bold;
                    display: none;
                }
                .no-captcha {
                    background-color: #ccffcc;
                    color: #006600;
                    display: none;
                }
            </style>
        </head>
        <body>
            <div class="container">
                <h1>Detector de Gateways de Pagamento do H7</h1>
                <input type="text" id="urlInput" placeholder="https://mybrand.shoes/en/content/6-payment-methods">
                <button onclick="detectPaymentGateway()">Detectar</button>
                <div class="result" id="result"></div>
                <div class="captcha-status" id="captchaStatus"></div>
                <div class="no-captcha" id="noCaptchaStatus"></div>
            </div>
            <script>
                async function detectPaymentGateway() {
                    const url = document.getElementById('urlInput').value.trim();
                    const resultDiv = document.getElementById('result');
                    const captchaDiv = document.getElementById('captchaStatus');
                    const noCaptchaDiv = document.getElementById('noCaptchaStatus');

                    if (!url) {
                        resultDiv.textContent = "Insira uma URL válida.";
                        captchaDiv.style.display = "none";
                        noCaptchaDiv.style.display = "none";
                        return;
                    }

                    resultDiv.textContent = "Detectando... (pode levar 20 segundos)";
                    captchaDiv.style.display = "none";
                    noCaptchaDiv.style.display = "none";

                    try {
                        const response = await fetch(\`/detect?url=\${encodeURIComponent(url)}\`);

                        if (!response.ok) {
                            throw new Error(\`Erro no servidor: \${response.status} - \${response.statusText}\`);
                        }

                        const result = await response.json();
                        resultDiv.textContent = result.detected;

                        if (result.captchaDetected) {
                            captchaDiv.textContent = "CAPTCHA Detectado!";
                            captchaDiv.style.display = "block";
                        } else {
                            noCaptchaDiv.textContent = "Nenhum CAPTCHA Detectado.";
                            noCaptchaDiv.style.display = "block";
                        }
                    } catch (error) {
                        resultDiv.textContent = \`Erro ao detectar: \${error.message}\`;
                        captchaDiv.style.display = "none";
                        noCaptchaDiv.style.display = "none";
                    }
                }
            </script>
        </body>
        </html>
    `);
});

app.get('/detect', async (req, res) => {
    const url = req.query.url;
    if (!url) {
        return res.status(400).send('URL is required');
    }

    try {
        const browser = await puppeteer.launch();
        const page = await browser.newPage();
        await page.goto(url, { waitUntil: 'networkidle2' });
        const content = await page.content();
        await browser.close();

        const htmlLower = content.toLowerCase();

        const gateways = {
            'PayPal': [/paypal/, /pp\.com/, /paypal\.com/],
            'Stripe': [/stripe/, /card payments/, /stripe checkout/, /powered by stripe/, /stripe.com/],
            'CAPTCHA': [/captcha/, /g-recaptcha/, /recaptcha/],
            'Credit Card': [/card number/, /cvc/],
        };

        const detected = [];
        let captchaDetected = false;
        for (const [gateway, patterns] of Object.entries(gateways)) {
            if (patterns.some(pattern => pattern.test(htmlLower))) {
                detected.push(gateway);
                if (gateway === 'CAPTCHA') {
                    captchaDetected = true;
                }
            }
        }

        res.json({
            detected: detected.length > 0 ? detected.join(', ') : 'Nenhum gateway explícito encontrado.',
            captchaDetected: captchaDetected
        });
    } catch (error) {
        res.status(500).send(`Erro: ${error.message}`);
    }
});

app.listen(port, () => {
    console.log(`Servidor rodando em http://localhost:${port}`);
});
