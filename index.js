const express = require('express');
const axios = require('axios');
const app = express();

app.use(express.json());

// 1. Verificación del Webhook para Meta
app.get('/webhook', (req, res) => {
    const mode = req.query['hub.mode'];
    const token = req.query['hub.verify_token'];
    const challenge = req.query['hub.challenge'];

    if (mode && token) {
        if (mode === 'subscribe' && token === process.env.VERIFY_TOKEN) {
            console.log('WEBHOOK_VERIFIED');
            return res.status(200).send(challenge);
        } else {
            return res.status(403).sendStatus(403);
        }
    }
});

// 2. Recepción de comentarios en tiempo real
app.post('/webhook', async (req, res) => {
    const body = req.body;

    if (body.object === 'instagram') {
        try {
            for (const entry of body.entry) {
                if (entry.changes) {
                    for (const change of entry.changes) {
                        // Comprobamos si es un comentario nuevo
                        if (change.field === 'comments') {
                            const commentData = change.value;
                            const commentId = commentData.id;
                            const commentText = commentData.text ? commentData.text.toLowerCase() : '';
                            
                            console.log(`Nuevo comentario recibido: "${commentText}"`);

                            // PALABRA CLAVE: Cambia 'info' por la palabra que desees (en minúsculas)
                            if (commentText.includes('cuchufletas')) {
                                await enviarRespuestaAutomatica(commentId);
                            }
                        }
                    }
                }
            }
            return res.status(200).send('EVENT_RECEIVED');
        } catch (error) {
            console.error('Error procesando el evento:', error);
            return res.status(500).send('INTERNAL_SERVER_ERROR');
        }
    } else {
        return res.sendStatus(404);
    }
});

// 3. Función para responder al comentario de forma privada
async function enviarRespuestaAutomatica(commentId) {
    const instagramToken = process.env.INSTAGRAM_TOKEN;
    
    // MENSAJE AUTOMÁTICO: Modifica este texto con lo que quieras enviar
    const mensajeTexto = "¡Hola! Gracias por tu comentario. Aquí tienes toda la información de La Tribu Encaja: https://latribuencaja.com";

    const url = `https://graph.facebook.com/v21.0/${commentId}/replies`;

    try {
        await axios.post(url, {
            message: mensajeTexto
        }, {
            headers: { 'Authorization': `Bearer ${instagramToken}` }
        });
        console.log(`Respuesta enviada con éxito al comentario ${commentId}`);
    } catch (error) {
        console.error('Error al enviar la respuesta de Instagram:', error.response ? error.response.data : error.message);
    }
}

// Iniciar el servidor
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`El bot de La Tribu Encaja está funcionando en el puerto ${PORT}`);
});
