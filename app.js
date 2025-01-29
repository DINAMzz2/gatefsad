const express = require('express');
const axios = require('axios');
const cheerio = require('cheerio');

const app = express();
const port = process.env.PORT || 3000;

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
                        resultDiv.textContent = \`Erro: \${error.message}\`;
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
        const { data } = await axios.get(url);
        const htmlLower = data.toLowerCase();
        const $ = cheerio.load(htmlLower);

        const gateways = {
            // Global
            'PayPal': [/paypal\.com/, /pp\.com/, /paypal checkout/, /powered by paypal/, /paypal\//],
            'Stripe': [
                /stripe\.com/,
                /stripe checkout/,
                /powered by stripe/,
                /card payments with stripe/,
                /stripe\.js/,
                /stripe gateway/,
                /stripe\.api/,
                /stripe integration/,
                /powered by stripe\./,
                /using stripe/,
                /stripe terminal/,
                /stripe payment/,
                /stripe connect/,
                /stripe express/
            ],
            'Square': [/squareup\.com/, /square\.com/, /powered by square/, /square payments/],
            'Adyen': [/adyen\.com/, /powered by adyen/, /adyen checkout/],
            'Worldpay': [/worldpay\.com/, /powered by worldpay/, /worldpay payments/],
            'Authorize.Net': [/authorize\.net/, /powered by authorize\.net/, /authorize payments/],
            '2Checkout': [/2checkout\.com/, /powered by 2checkout/, /2checkout payments/],
            'Skrill': [/skrill\.com/, /powered by skrill/, /skrill checkout/],
            'Amazon Pay': [/pay\.amazon\.com/, /powered by amazon pay/, /amazon payments/],
            'Braintree': [/braintreepayments\.com/, /powered by braintree/, /braintree payments/],
            'WePay': [/wepay\.com/, /powered by wepay/, /wepay payments/],

            // Nacional (Brasil)
            'Mercado Pago': [/mercadopago\.com\.br/, /mercado pago checkout/, /powered by mercado pago/, /mercadopago\//],
            'PagSeguro': [/pagseguro\.uol\.com\.br/, /powered by pagseguro/, /pagseguro payments/],
            'Cielo': [/cielo\.com\.br/, /powered by cielo/, /cielo payments/],
            'Stone': [/stone\.com\.br/, /powered by stone/, /stone payments/],
            'Oi Pagamentos': [/oi\.pagseguro/, /powered by oi pagamentos/],
            'PicPay': [/picpay\.com/, /powered by picpay/, /picpay payments/],
            'Rede': [/userede\.com\.br/, /powered by rede/, /rede payments/],
            'Vindi': [/vindi\.com\.br/, /powered by vindi/, /vindi payments/],
            'GetNet': [/getnet\.com\.br/, /powered by getnet/, /getnet payments/],
            'Iugu': [/iugu\.com/, /powered by iugu/, /iugu payments/],
            'Nuvemshop': [/nuvemshop\.com\.br/, /powered by nuvemshop/, /nuvemshop payments/],
            'Pagar.me': [/pagar\.me/, /powered by pagar.me/, /pagarme/, /soluções de pagamento pagar\.me/, /pagarme payments/],
            'Payflow': [/payflow\.com\.br/, /powered by payflow/, /payflow payments/],
            'B3': [/b3\.com\.br/, /powered by b3/, /b3 payments/],
            'EBANX': [/ebanx\.com/, /powered by ebanx/, /ebanx payments/],
            'Magento': [/magento\.com/, /powered by magento/, /magento payments/],
            'Braspag': [/braspag\.com\.br/, /powered by braspag/, /braspag payments/],
            'VTEX': [/vtex\.com\.br/, /powered by vtex/, /vtex\.com/, /vtex payments/],

            // Detecção de CAPTCHA e reCAPTCHA
            'CAPTCHA': [/captcha/, /g-recaptcha/, /recaptcha/, /captcha\.v3/],
        };

        const detected = [];
        let captchaDetected = false;

        // Analisa apenas as áreas relevantes
        const paymentSections = $('div:contains("payment"), div:contains("checkout"), form:contains("payment")').html() || htmlLower;

        for (const [gateway, patterns] of Object.entries(gateways)) {
            if (patterns.some(pattern => pattern.test(paymentSections))) {
                if (gateway === 'CAPTCHA') {
                    captchaDetected = true;
                } else {
                    detected.push(gateway);
                }
            }
        }

        res.json({
            detected: detected.length > 0 ? detected.join(', ') : 'Nenhum gateway explícito encontrado.',
            captchaDetected: captchaDetected
        });
    } catch (error) {
        console.error('Erro:', error);
        res.status(500).send(`Erro: ${error.message}`);
    }
});

app.listen(port, () => {
    console.log(`Servidor rodando na porta ${port}`);
});
