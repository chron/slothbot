let { nanoid } = require('nanoid');
let arc = require('@architect/functions');

module.exports.handler = async function(event) {
  const parsedBody = Buffer.from(event.body, 'base64').toString('utf-8');
  const bodyParams = new URLSearchParams(parsedBody);
  const params = Object.fromEntries(bodyParams);

  const [command, ...restOfInput] = params.text.split(' ');
  const memeUrl = restOfInput.join(' ');

  let responseText;

  if (command === 'meme') {
    if (memeUrl.match(/^https?:\/\//)) {
      let data = await arc.tables();
      await data.memes.put({
        memeID: nanoid(),
        createdAt: new Date().toISOString(),
        createdBy: params.user_id,
        url: memeUrl,
      })

      responseText = `Thanks for your meme, <@${params.user_id}>!`;
    } else {
      responseText = 'Please provide a valid URL.';
    }
  } else if (command === 'memelist') {
    let data = await arc.tables();
    responseText = (await data.memes.scan()).Items.map((meme) => {
      return `• ${meme.url} (from <@${meme.createdBy}>)`;
    }).join("\n");
  } else {
    responseText = `Invalid command! Try ${params.command} meme ...`;
  }

  const body = JSON.stringify({
    response_type: "ephemeral", // or "in_channel"
    blocks: [
      {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: responseText,
        },
      },
    ],
  });

  return {
    statusCode: 200,
    headers: {
      "Content-Type": 'application/json',
    },
    body,
  };
}
