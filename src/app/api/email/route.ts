import nodemailer from "nodemailer";
import { NextRequest, NextResponse } from "next/server";

async function sendEmail(
  host: string,
  port: number,
  tls: boolean,
  receiver: string,
  subject: string,
  body: string,
  delayBetweenEmails?: number,
  username?: string,
  password?: string,
  sender?: string,
  attachments?: { filename: string; path: string }[]
) {
  const transporter = nodemailer.createTransport({
    host,
    port,
    secure: tls,
    // auth: username && password ? { user: username, pass: password } : undefined,
  });

  const mailOptions = {
    from: sender ? sender : username ? username : "bulk-mailer@email.com",
    to: receiver,
    subject,
    text: body,
    attachments,
  };

  if (delayBetweenEmails) {
    await new Promise((resolve) =>
      setTimeout(resolve, Number(delayBetweenEmails))
    );
  }

  return transporter.sendMail(mailOptions);
}

let message: string;

export async function POST(req: NextRequest) {
  try {
    const {
      smtps,
      leads,
      subject,
      body,
      // sender,
      // attachments,
      randomSmtp,
      delayBetweenEmails,
    } = await req.json();

    console.log("smtps: ", smtps);
    console.log("leads: ", leads);
    console.log("subject: ", subject);
    console.log("body: ", body);
    console.log("randomSmtp: ", randomSmtp);
    console.log("delayBetweenEmails: ", delayBetweenEmails);

    // if (
    //   !smtps ||
    //   !leads ||
    //   !subject ||
    //   !body ||
    //   randomSmtp === undefined ||
    //   delayBetweenEmails === undefined
    // ) {
    //   return NextResponse.json({ error: "Provide all field" }, { status: 400 });
    // }

    for (const lead of leads) {
      // const firstName = lead.firstName;
      // const lastName = lead.lastName;
      console.log("lead: ", lead);
      console.log("email: ", lead.email);
      const receiver = lead.email;
      console.log("receiver outside: ", receiver);

      if (randomSmtp) {
        const randomSmtp = smtps[Math.floor(Math.random() * smtps.length)];
        await sendEmail(
          randomSmtp.host,
          randomSmtp.port,
          randomSmtp.tls,
          randomSmtp.username,
          randomSmtp.password,
          receiver,
          subject,
          body,
          delayBetweenEmails
        );
        message = `Email sent from ${randomSmtp.username} to ${receiver}`;
        console.log(message);

        return NextResponse.json({ message }, { status: 200 });
      } else {
        for (const smtp of smtps) {
          await sendEmail(
            smtp.host,
            smtp.port,
            smtp.tls,
            receiver,
            subject,
            body,
            delayBetweenEmails,
            smtp.username,
            smtp.password
          );

          message = `Email sent from ${smtp.username} to ${receiver}`;
          console.log(message);
          return NextResponse.json({ message }, { status: 200 });
        }
      }
    }
  } catch (error) {
    console.error("Error sending email:", error);
    return NextResponse.json({ error: "Error sending email" }, { status: 500 });
  }

  // Send logs to frontend
  return new NextResponse(
    new ReadableStream({
      start(controller) {
        controller.enqueue(
          JSON.stringify({
            message: message || "Error in logs",
          })
        );
        controller.close();
      },
    }),
    {
      headers: {
        "Content-Type": "application/json",
      },
    }
  );
}

// for (const folder of selectedFolderOptions) {
//   const leads = db.leads.where({ folderId: folder.folderId });
//   if (!leads || (await leads.count()) === 0) {
//     console.log(`No leads found in folder: ${folder.folderName}`);
//     continue;
//   }
//   setLeads(leads);
// }
// const leadsArray = await leads.toArray();
