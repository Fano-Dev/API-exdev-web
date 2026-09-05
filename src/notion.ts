export type Env = {
  NOTION_TOKEN: string;
  NOTION_DATA_SOURCE_ID: string;
  NOTION_PROJECTS_DATA_SOURCE_ID: string;
};

export type NotionColor =
  | "default"
  | "gray"
  | "brown"
  | "orange"
  | "yellow"
  | "green"
  | "blue"
  | "purple"
  | "pink"
  | "red";

export type Project = {
  id: string;
  name: string;
  state: {
    name: string;
    color: NotionColor;
  };
  responsible: string[];
  areas: {
    name: string;
    color: NotionColor;
  }[];
  description: string;
  imageUrl: string;
};

type NotionOption = {
  id?: string;
  name?: string;
  color?: NotionColor;
};

type NotionProperty = {
  title?: Array<{ plain_text?: string }>;
  rich_text?: Array<{ plain_text?: string }>;
  multi_select?: Array<{ name?: string }>;
  files?: Array<{
    name?: string;
    type?: string;
    file?: { url?: string };
    external?: { url?: string };
  }>;
  email?: string;
  status?: { name?: string };
  people?: Array<{ id?: string }>;
};

type NotionPage = {
  id: string;
  icon?: {
    type?: string;
    emoji?: string;
  } | null;
  cover?: unknown;
  properties: Record<string, NotionProperty>;
};

type NotionBlock = {
  id: string;
  type?: string;
  has_children?: boolean;
  image?: {
    type?: string;
    file?: { url?: string };
    external?: { url?: string };
  };
};

type NotionDataSource = {
  properties?: Record<
    string,
    {
      type?: string;
      status?: { options?: NotionOption[] };
      multi_select?: { options?: NotionOption[] };
    }
  >;
};

type NotionUser = {
  name?: string;
};

/* =========================================================
   MEMBERS
   ========================================================= */

async function getMemberPhotoUrl(
  pageId: string,
  env: Env
): Promise<string> {
  const response = await fetch(
    `https://api.notion.com/v1/blocks/${pageId}/children`,
    {
      headers: {
        Authorization: `Bearer ${env.NOTION_TOKEN}`,
        "Notion-Version": "2025-09-03",
      },
    }
  );

  if (!response.ok) return "";

  const data = await response.json() as {
    results: NotionBlock[];
  };

  for (const block of data.results) {
    if (block.type === "image") {
      return (
        block.image?.file?.url ||
        block.image?.external?.url ||
        ""
      );
    }

    if (block.has_children) {
      const photoUrl = await getMemberPhotoUrl(
        block.id,
        env
      );

      if (photoUrl) return photoUrl;
    }
  }

  return "";
}

export async function getMembers(env: Env) {
  const response = await fetch(
    `https://api.notion.com/v1/data_sources/${env.NOTION_DATA_SOURCE_ID}/query`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${env.NOTION_TOKEN}`,
        "Content-Type": "application/json",
        "Notion-Version": "2025-09-03",
      },
      body: JSON.stringify({
        filter: {
          and: [
            {
              property: "Organización",
              multi_select: {
                contains: "✨ ExDev ✨",
              },
            },
            {
              property: "Puesto de trabajo",
              multi_select: {
                does_not_contain: "Inactivo",
              },
            },
          ],
        },
      }),
    }
  );

  if (!response.ok) {
    const error = await response.text();

    throw new Error(
      `Error de Notion: ${response.status} ${error}`
    );
  }

  const data = await response.json() as {
    results: NotionPage[];
  };

  const members = await Promise.all(
    data.results.map(async (member) => {
      const puestos =
        member.properties["Puesto de trabajo"]
          ?.multi_select
          ?.map((option) => option.name || "") || [];

      return {
        id: member.id,

        name:
          member.properties.Nombre
            ?.title?.[0]
            ?.plain_text || "",

        roles: puestos,

        email:
          member.properties.Email
            ?.email || "",

        career:
          member.properties.Carrera
            ?.rich_text?.[0]
            ?.plain_text || "",

        photoUrl:
          await getMemberPhotoUrl(
            member.id,
            env
          ),

        icon:
          member.icon?.emoji || "",

        projects: [],
        skills: [],
        interests: [],
      };
    })
  );

  return members;
}

/* =========================================================
   MEMBER STATUS FOR PROJECT FILTER
   ========================================================= */

async function getMemberStatusByName(
  env: Env
): Promise<Map<string, boolean>> {
  const response = await fetch(
    `https://api.notion.com/v1/data_sources/${env.NOTION_DATA_SOURCE_ID}/query`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${env.NOTION_TOKEN}`,
        "Content-Type": "application/json",
        "Notion-Version": "2025-09-03",
      },
      body: JSON.stringify({
        filter: {
          property: "Organización",
          multi_select: {
            contains: "✨ ExDev ✨",
          },
        },
      }),
    }
  );

  if (!response.ok) {
    const error = await response.text();

    throw new Error(
      `Error obteniendo estado de miembros: ${response.status} ${error}`
    );
  }

  const data = await response.json() as {
    results: NotionPage[];
  };

  const statusByName = new Map<string, boolean>();

  for (const member of data.results) {
    const name =
      member.properties.Nombre
        ?.title?.[0]
        ?.plain_text || "";

    if (!name) continue;

    const puestos =
      member.properties["Puesto de trabajo"]
        ?.multi_select
        ?.map((option) => option.name || "")
        .filter(Boolean) || [];

    const isInactive = puestos.some((puesto) =>
      puesto.toLowerCase().includes("inactivo")
    );

    statusByName.set(
      name.trim().toLowerCase(),
      !isInactive
    );
  }

  return statusByName;
}

/* =========================================================
   NOTION USERS
   ========================================================= */

async function getNotionUser(
  userId: string,
  env: Env
): Promise<NotionUser> {
  const response = await fetch(
    `https://api.notion.com/v1/users/${userId}`,
    {
      headers: {
        Authorization: `Bearer ${env.NOTION_TOKEN}`,
        "Notion-Version": "2025-09-03",
      },
    }
  );

  if (!response.ok) return {};

  return await response.json() as NotionUser;
}

/* =========================================================
   PROJECT DATA SOURCE
   ========================================================= */

async function getProjectDataSource(
  env: Env
): Promise<NotionDataSource> {
  const response = await fetch(
    `https://api.notion.com/v1/data_sources/${env.NOTION_PROJECTS_DATA_SOURCE_ID}`,
    {
      headers: {
        Authorization: `Bearer ${env.NOTION_TOKEN}`,
        "Notion-Version": "2025-09-03",
      },
    }
  );

  if (!response.ok) {
    const error = await response.text();

    throw new Error(
      `Error obteniendo esquema de Proyectos: ${response.status} ${error}`
    );
  }

  return await response.json() as NotionDataSource;
}

/* =========================================================
   PROJECTS
   ========================================================= */

export async function getProjects(
  env: Env
): Promise<Project[]> {
  const dataSource =
    await getProjectDataSource(env);

  const stateOptions =
    dataSource.properties
      ?.Estado
      ?.status
      ?.options || [];

  const areaOptions =
    dataSource.properties
      ?.["Áreas"]
      ?.multi_select
      ?.options || [];

  const memberStatusByName =
    await getMemberStatusByName(env);

  const response = await fetch(
    `https://api.notion.com/v1/data_sources/${env.NOTION_PROJECTS_DATA_SOURCE_ID}/query`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${env.NOTION_TOKEN}`,
        "Content-Type": "application/json",
        "Notion-Version": "2025-09-03",
      },
    }
  );

  if (!response.ok) {
    const error = await response.text();

    throw new Error(
      `Error de Notion: ${response.status} ${error}`
    );
  }

  const data = await response.json() as {
    results: NotionPage[];
  };

  const projects = await Promise.all(
    data.results.map(async (project) => {
      const properties =
        project.properties;

      /* -----------------------------------------------------
         ESTADO
         ----------------------------------------------------- */

      const stateName =
        properties.Estado
          ?.status
          ?.name || "";

      /*
       * No mostrar proyectos:
       * - Inconcluso
       * - Sin terminar
       */

      const hiddenStates = [
        "inconcluso",
        "sin terminar",
      ];

      if (
        hiddenStates.includes(
          stateName.trim().toLowerCase()
        )
      ) {
        return null;
      }

      const stateOption =
        stateOptions.find(
          (option) =>
            option.name === stateName
        );

      /* -----------------------------------------------------
         RESPONSABLES
         ----------------------------------------------------- */

      const responsibleIds =
        properties.Responsable
          ?.people
          ?.map((person) => person.id || "")
          .filter(Boolean) || [];

      const responsible =
        await Promise.all(
          responsibleIds.map(async (id) => {
            const user =
              await getNotionUser(id, env);

            return user.name || "";
          })
        );

      /* -----------------------------------------------------
         FILTRO DE RESPONSABLES INACTIVOS
         ----------------------------------------------------- */

      const responsibleStatuses =
        responsible
          .filter(Boolean)
          .map((name) =>
            memberStatusByName.get(
              name.trim().toLowerCase()
            )
          );

      const hasUnknownResponsible =
        responsibleStatuses.some(
          (status) => status === undefined
        );

      const allResponsibleInactive =
        responsibleStatuses.length > 0 &&
        responsibleStatuses.every(
          (status) => status === false
        );

      /*
       * Solo ocultamos el proyecto si TODOS
       * los responsables conocidos están inactivos.
       *
       * Si hay al menos uno activo:
       * -> mostrar.
       *
       * Si no conocemos el estado de alguno:
       * -> mostrar.
       */

      if (
        allResponsibleInactive &&
        !hasUnknownResponsible
      ) {
        return null;
      }

      /* -----------------------------------------------------
         ÁREAS
         ----------------------------------------------------- */

      const areas =
        properties["Áreas"]
          ?.multi_select
          ?.map((area) => {
            const areaName =
              area.name || "";

            const areaOption =
              areaOptions.find(
                (option) =>
                  option.name === areaName
              );

            return {
              name: areaName,
              color:
                areaOption?.color ||
                "default",
            };
          })
          .filter(
            (area) => area.name
          ) || [];

      /* -----------------------------------------------------
         PROJECT
         ----------------------------------------------------- */

      return {
        id: project.id,

        name:
          properties["Nombre Proyecto"]
            ?.title?.[0]
            ?.plain_text || "",

        state: {
          name: stateName,
          color:
            stateOption?.color ||
            "default",
        },

        responsible,

        areas,

        description:
  properties["Descripción"]
    ?.rich_text
    ?.map((item) => item.plain_text || "")
    .join("") || "",

      imageUrl:
        properties["Imagen"]
          ?.files?.[0]
          ?.file?.url ||
        properties["Imagen"]
          ?.files?.[0]
          ?.external?.url ||
        "",
      };
    })
  );

  /* ---------------------------------------------------------
     REMOVE HIDDEN PROJECTS
     --------------------------------------------------------- */

  return projects.filter(
    (project): project is Project =>
      project !== null
  );
}