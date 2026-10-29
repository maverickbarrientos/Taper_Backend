import "dotenv/config"
import fs from "node:fs";
import path from "node:path";
import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT ?? 587),
  secure: process.env.SMTP_SECURE === "true",
  auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
});

const escapeHtml = (value: string) =>
  value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

const render = (template: string, values: Record<string, string>) =>
  template.replace(/{{(\w+)}}/g, (_, key: string) => escapeHtml(values[key] ?? ""));

export async function sendAthleteCredentials(
  athlete: { email: string, firstName: string },
  password: string,
  coachName: string = "Your coach"
) {

  const { email: to, firstName } = athlete;

  const template = fs.readFileSync(path.resolve(__dirname, "../emails/athlete-welcome.html"), "utf-8");
  const loginUrl = process.env.APP_LOGIN_URL ?? "";

  await transporter.sendMail({
    from: process.env.MAIL_FROM,
    to,
    subject: "Your Taper account is ready",
    html: render(template, { firstName, coachName, email: to, password, loginUrl }),
    text: [
      `Welcome, ${firstName}.`,
      `${coachName} has set up your Taper account.`,
      "",
      `Email: ${to}`,
      `Temporary password: ${password}`,
      `Sign in: ${loginUrl}`,
      "",
      "Please change your password the first time you sign in.",
    ].join("\n"),
  });
}
