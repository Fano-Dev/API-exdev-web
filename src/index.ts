import { Hono } from "hono";
import { cors } from "hono/cors";
import { getMembers, getProjects } from "./notion";

type Env = {
  Bindings: {
    NOTION_TOKEN: string;
    NOTION_DATA_SOURCE_ID: string;
    NOTION_PROJECTS_DATA_SOURCE_ID: string;
  };
};

const app = new Hono<Env>();

app.use(
  "*",
  cors({
    origin: [
      "http://localhost:3000",
    ],
  })
);

app.get("/", (c) => {
  return c.json({
    message: "API ExDev funcionando",
  });
});

app.get("/miembros", async (c) => {
  try {
    const members = await getMembers(c.env);

    return c.json(members);
  } catch (error) {
    console.error(error);

    return c.json(
      {
        error: "No se pudieron obtener los miembros",
      },
      500
    );
  }
});

app.get("/proyectos", async (c) => {
  try {
    const projects = await getProjects(c.env);

    return c.json(projects);
  } catch (error) {
    console.error(error);

      return c.json(
      {
      error: "No se pudieron obtener los proyectos",
      },
      500
    );
  }
});

export default app;