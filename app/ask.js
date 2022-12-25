const { Configuration, OpenAIApi } = require("openai");

exports.main = async function(event, context) {
  try {
    var method = event.httpMethod;

    if (method === "GET" && event?.queryStringParameters?.question) {
      if (event.queryStringParameters.question.length >= 3) {

        console.log("Question: " + event.queryStringParameters.question)
        const configuration = new Configuration({
          apiKey: process.env.OPEN_AI_KEY,
        });

        const openai = new OpenAIApi(configuration);
        const response = await openai.createCompletion({
          model: "text-davinci-003",
          prompt: event.queryStringParameters.question,
          temperature: 0,
          max_tokens: 256,
          top_p: 1,
          frequency_penalty: 0,
          presence_penalty: 0,
        });

        console.log(response.data)
        
        var body = {
          question: event.queryStringParameters.question,
          answer: response.data.choices[0].text 
        };
        return {
          statusCode: 200,
          headers: {},
          body: JSON.stringify(body)
        };
      }
    }

    // We only accept GET for now
    return {
      statusCode: 400,
      headers: {},
      body: "We only accept GET /?question=Was soll ich heute kochen?"
    };
  } catch(error) {
    var body = error.stack || JSON.stringify(error, null, 2);
    return {
      statusCode: 400,
        headers: {},
        body: JSON.stringify(error)
    }
  }
}