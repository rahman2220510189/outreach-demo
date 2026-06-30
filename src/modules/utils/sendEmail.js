const { SESClient, SendEmailCommand } = require('@aws-sdk/client-ses');

const SOURCE_LABELS = {
    osm_scraper: 'OpenStreetMap public business directory',
    cyprus_atlas: 'Cyprus Atlas business directory',
    csv: 'a public business directory',
    manual: 'a public business directory'
};

const sendEmail = async ({ toEmail, subject, body, contactName, source }) => {

    const sesClient = new SESClient({
        region: process.env.AWS_REGION,
        credentials: {
            accessKeyId: process.env.AWS_ACCESS_KEY_ID,
            secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
        }
    });

    const sourceLabel = SOURCE_LABELS[source] || 'a public business directory';
    const formattedBody = body.replace(/\n/g, '<br/>'); 
    const unsubscribeUrl = `${process.env.BACKEND_URL}/api/contacts/unsubscribe?email=${encodeURIComponent(toEmail)}`;

    const htmlBody = `
    <html>
        <body style="font-family: Arial, sans-serif; color: #333; max-width: 600px; margin: 0 auto;">
            
            <p>Hi ${contactName || 'there'},</p>

          <p style="font-size: 14px; color: #333; margin-bottom: 16px;">
    We found your business contact details on ${sourceLabel}. 
    We are reaching out because we believe our services may be relevant to your business.
</p>

            ${formattedBody}

            <br/>
            <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;"/>
            
            <table style="width: 100%; font-size: 11px; color: #999;">
                <tr>
                    <td>
                        <strong>Ainoviro</strong><br/>
                        Anafis 8, Larnaca, Cyprus<br/>
                        <a href="https://www.ainoviro.com/privacy-policy" style="color: #999;">Privacy Policy</a> · 
                        <a href="https://www.ainoviro.com/terms-conditions" style="color: #999;">Terms & Conditions</a>
                    </td>
                    <td style="text-align: right; vertical-align: top;">
                        <a href="${unsubscribeUrl}" 
                           style="background: #f1f1f1; color: #666; padding: 6px 12px; border-radius: 4px; text-decoration: none; font-size: 11px;">
                            Unsubscribe
                        </a>
                        <p style="margin-top: 6px;">
                            You received this because we found your business online.<br/>
                            Legal basis: Legitimate Interest (GDPR Art. 6(1)(f))
                        </p>
                    </td>
                </tr>
            </table>

        </body>
    </html>
    `;

    const params = {
        Source: process.env.AWS_SES_FROM_EMAIL,
        Destination: { ToAddresses: [toEmail] },
        Message: {
            Subject: { Data: subject, Charset: 'UTF-8' },
            Body: { Html: { Data: htmlBody, Charset: 'UTF-8' } }
        },
    };

    const command = new SendEmailCommand(params);
    return await sesClient.send(command);
};

module.exports = { sendEmail };