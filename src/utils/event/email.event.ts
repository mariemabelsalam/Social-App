import { EventEmitter } from 'node:events';
import Mail from 'nodemailer/lib/mailer';
import { sendEmail } from '../email/send.email';
import { verifyEmail } from '../email/verify.template';

export const emailEvent = new EventEmitter();

interface IEmail extends Mail.Options {
    otp: number
}


emailEvent.on('confirmEmail', async (data: IEmail) => {
    try {
        data.subject = "confirm email";
        data.html = verifyEmail({ otp: data.otp, title: "email confirmation" })
        await sendEmail(data)
    } catch (error) {
        console.log('fail to send email', error);

    }
})