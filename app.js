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
                <input type="text" id="urlInput" placeholder="Digite URLs separadas por espaço">
                <button onclick="detectPaymentGateway()">Detectar</button>
                <div class="result" id="result"></div>
            </div>
            <script>
                async function detectPaymentGateway() {
                    const urls = document.getElementById('urlInput').value.trim().split(' ').map(url => url.trim());
                    const resultDiv = document.getElementById('result');

                    if (!urls || urls.length === 0) {
                        resultDiv.textContent = "Insira URLs válidas.";
                        return;
                    }

                    resultDiv.textContent = "Detectando... (pode levar alguns segundos)";
                    let results = "";

                    for (const url of urls) {
                        try {
                            const response = await fetch(\`/detect?url=\${encodeURIComponent(url)}\`);
                            const result = await response.json();

                            results += \`<strong>Resultado para \${url}:</strong><br>\${result.detected}<br>\`;

                            if (result.captchaDetected) {
                                results += \`<span style="color: red;">✔ CAPTCHA Detectado!</span><br><br>\`;
                            } else {
                                results += \`<span style="color: green;">❌ Nenhum CAPTCHA Detectado.</span><br><br>\`;
                            }

                        } catch (error) {
                            results += \`Erro ao detectar para \${url}: \${error.message}<br><br>\`;
                        }
                    }

                    resultDiv.innerHTML = results;
                }
            </script>
        </body>
        </html>
    `);
});

app.get('/detect', async (req, res) => {
    const url = req.query.url;
    if (!url) {
        return res.status(400).send('URL é obrigatória');
    }

    // Verificar se a URL é válida
    try {
        const newUrl = new URL(url);  // Tentativa de criar um objeto URL válido
    } catch (error) {
        return res.status(400).json({ error: 'URL inválida. Certifique-se de incluir o protocolo (http:// ou https://).' });
    }

    try {
        const { data } = await axios.get(url);
        const htmlLower = data.toLowerCase();
        const $ = cheerio.load(htmlLower);

        const gateways = {
            // (defina seus gateways aqui como no código anterior)
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
'Mercado Pago': [/mercadopago\.com\.br/, /mercado pago/, /checkout mercado pago/, /pagamento com mercado pago/, /mercado pago transparente/, /parcelamento mercado pago/, /mp pagamentos/],
'PagSeguro': [/pagseguro\.uol\.com\.br/, /pagseguro/, /checkout pagseguro/, /pagamento com pagseguro/, /parcelamento pagseguro/, /boleto pagseguro/, /assinatura pagseguro/, /pagbank/],
'Cielo': [/cielo\.com\.br/, /pagamento com cielo/, /checkout cielo/, /soluções cielo/, /cielo ecommerce/, /link de pagamento cielo/, /maquininha cielo/],
'Stone': [/stone\.com\.br/, /pagamento com stone/, /checkout stone/, /soluções stone/, /maquininha stone/, /link de pagamento stone/, /parcelamento stone/],
'Oi Pagamentos': [/oi\.pagseguro/, /pagamento com oi/, /checkout oi pagamentos/, /oi carteira digital/, /recarga oi pag/],
'PicPay': [/picpay\.com/, /pagamento com picpay/, /picpay checkout/, /pix pelo picpay/, /parcelamento picpay/, /qr code picpay/, /saldo picpay/],
'Rede': [/userede\.com\.br/, /pagamento com rede/, /checkout rede/, /soluções rede/, /maquininha rede/, /link de pagamento rede/, /rede ecommerce/],
'Vindi': [/vindi\.com\.br/, /pagamento com vindi/, /checkout vindi/, /assinatura vindi/, /cobrança recorrente vindi/, /vindi boleto/],
'GetNet': [/getnet\.com\.br/, /pagamento com getnet/, /checkout getnet/, /soluções getnet/, /maquininha getnet/, /boleto getnet/, /link de pagamento getnet/],
'Iugu': [/iugu\.com/, /pagamento com iugu/, /checkout iugu/, /cobrança recorrente iugu/, /assinatura iugu/, /boleto iugu/, /api iugu/],
'Nuvemshop': [/nuvemshop\.com\.br/, /pagamento com nuvemshop/, /checkout nuvemshop/, /nuvempago/, /soluções nuvemshop/],
'Pagar.me': [/pagar\.me/, /pagamento com pagar\.me/, /checkout pagar\.me/, /parcelamento pagar\.me/, /api pagar\.me/, /link de pagamento pagar\.me/, /soluções pagar\.me/],
'Payflow': [/payflow\.com\.br/, /pagamento com payflow/, /checkout payflow/, /recarga payflow/, /saldo payflow/, /adiantamento salarial payflow/],
'Spreedly': [/spreedly\.com/, /powered by spreedly/, /spreedly api/, /checkout spreedly/, /spreedly vault/, /tokenization by spreedly/, /spreedly gateway/, /secure payments spreedly/, /payment orchestration spreedly/],
'B3': [/b3\.com\.br/, /plataforma de pagamentos b3/, /soluções de pagamento b3/, /b3 pagamentos/, /b3 pix/, /b3 pagamentos instantâneos/, /b3 liquidação financeira/],
'EBANX': [/ebanx\.com/, /pagamento com ebanx/, /checkout ebanx/, /soluções ebanx/, /ebanx pagamentos internacionais/, /boleto ebanx/, /ebanx api/],
'Magento': [/magento\.com/, /pagamento com magento/, /checkout magento/, /magento ecommerce/, /magento pagamentos/, /magento carrinho/],
'Braspag': [/braspag\.com\.br/, /pagamento com braspag/, /checkout braspag/, /soluções braspag/, /braspag api/, /parcelamento braspag/, /braspag recorrente/],
'VTEX': [/vtex\.com\.br/, /pagamento com vtex/, /checkout vtex/, /vtex ecommerce/, /vtex carrinho/, /soluções vtex/, /api vtex/],


            // Detecção de CAPTCHA e reCAPTCHA
            'CAPTCHA': [/captcha/, /g-recaptcha/, /recaptcha/, /captcha\.v3/],
        };

        const detected = [];
        let captchaDetected = false;

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
        res.status(500).json({ error: `Erro ao tentar acessar a URL: ${error.message}` });
    }
});

app.listen(port, () => {
    console.log(`Servidor rodando na porta ${port}`);
});
