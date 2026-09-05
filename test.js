require("dotenv").config();

const { Client } = require("@notionhq/client");

const notion = new Client({
  auth: process.env.NOTION_TOKEN,
});

const DATA_SOURCE_ID = process.env.NOTION_DATA_SOURCE_ID;

async function main() {
  try {
    const response = await notion.dataSources.query({
      data_source_id: DATA_SOURCE_ID,
    });

    console.log("Miembros encontrados:");
    console.log("----------------------");

    for (const member of response.results) {
      const nombre =
        member.properties.Nombre?.title?.[0]?.plain_text || "";

      const email =
        member.properties.Email?.email || "";

      const status =
        member.properties.Status?.status?.name || "";

      console.log(`Nombre: ${nombre}`);
      console.log(`Email: ${email}`);
      console.log(`Status: ${status}`);
      console.log("----------------------");
    }
  } catch (error) {
    console.error("Error:");
    console.error(error.message);
  }
}

main();