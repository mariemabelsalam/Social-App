

import { createTransport, Transporter } from 'nodemailer';
import { MailOptions } from 'nodemailer/lib/json-transport';
import SMTPTransport from 'nodemailer/lib/smtp-transport';
import { BadRequestException } from '../response/error.response';


export const sendEmail = async (data: MailOptions): Promise<void> => {
    if (!data.html && !data.attachments?.length && !data.text) {
        throw new BadRequestException("missing email content")
    }
        const transporter: Transporter<SMTPTransport.SentMessageInfo, SMTPTransport.Options> = createTransport({
            service: "gmail",
            auth: {
                user: process.env.APP_EMAIL as string,
                pass: process.env.APP_PASS as string,
            }
        })
    const info = await transporter.sendMail({
        ...data,
        from: ` " ${process.env.APPLICATION_NAME} " <${process.env.APP_EMAIL as string} >`,

    });

    console.log("Message sent:", info.messageId);

}

