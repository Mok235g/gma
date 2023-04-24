const { GoogleAuth } = require('google-auth-library');
const fs = require('fs');
const Imap = require('imap');
const simpleParser = require('mailparser').simpleParser;

const keyFile = 'key.json';
const scopes = ['https://mail.google.com/'];

(async () => {
  const auth = new GoogleAuth({
    keyFile,
    scopes,
  });

  const client = await auth.getClient();
  const token = await client.getAccessToken();
  const accessToken = token.token;

  const username = 'your_email@gmail.com';
  const imap = new Imap({
    user: username,
    xoauth2: accessToken,
    host: 'imap.gmail.com',
    port: 993,
    tls: {
      rejectUnauthorized: false
    }
  });
  

  function openInbox(cb) {
    imap.openBox('INBOX', true, cb);
  }

  imap.once('ready', function() {
    openInbox(function(err, box) {
      if (err) throw err;
      imap.search(['UNSEEN', ['FROM', 'accounts@roblox.com'], ['SINCE', 'April 24, 2023']], function(err, results) {
        if (err) throw err;
        if (results.length === 0) {
          console.log('No unread email from accounts@roblox.com found.');
          imap.end();
          return;
        }
        const f = imap.fetch(results, { bodies: '' });
        f.on('message', function(msg, seqno) {
          const prefix = `(#${seqno}) `;
          msg.on('body', function(stream, info) {
            simpleParser(stream, (err, parsed) => {
              if (err) throw err;
              console.log(prefix + 'Subject: ' + parsed.subject);
              console.log(prefix + 'From: ' + parsed.from.text);
              console.log(prefix + 'Body: ' + parsed.text);
              const codeMatch = parsed.text.match(/Verification Code: (\d{6})/);
              if (codeMatch) {
                console.log('Verification code:', codeMatch[1]);
              } else {
                console.log('No verification code found.');
              }
            });
          });
          msg.once('end', function() {
            imap.end();
          });
        });
        f.once('error', function(err) {
          throw err;
        });
      });
    });
  });

  imap.once('error', function(err) {
    console.error(err);
  });

  imap.once('end', function() {
    console.log('Connection ended');
  });

  imap.connect();
})();
