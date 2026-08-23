import { argv, fetch } from "bun";

const username = argv[2];

if (!username) {
  console.log("Introduce un nombre de usuario.");
  process.exit(1);
}

// Hacer fetch a la API de Github
let response: any;
try {
  response = await fetch(`https://api.github.com/users/${username}/events`, {
    headers: {
      "User-Agent": "github-activity-cli",
    },
  });
} catch (error) {
  console.log("Error al obtener la actividad del usuario.");
  process.exit(1);
}

if (!response.ok) {
  if (response.status === 404) {
    console.log(`Usuario "${username}" no encontrado.`);
  } else {
    console.log(`Error de la API: ${response.status}`);
  }
  process.exit(1);
}

console.log(`\nBuscando actividad de ${username}.`);

// Parsear la respuesta
const data: any = await response.json();
const pushPorRepo: Record<string, number> = {};
const pullPorRepo: Record<string, number> = {};
const commIssuePorRepo: Record<string, number> = {};

for (const item of data) {
  const repo = item.repo.name;

  switch (item.type) {
    case "PushEvent":
      pushPorRepo[repo] = (pushPorRepo[repo] || 0) + 1;
      break;

    case "ForkEvent":
      console.log(`- ${username} forkeo el repo: ${item.repo.name}.`);
      break;

    case "CreateEvent":
      console.log(
        `- ${username} creó ${item.payload.ref_type} "${item.payload.ref || ""}" en ${repo}.`,
      );
      break;

    case "WatchEvent":
      console.log(`- ${username} ha agregado como favorito ${item.repo.name}.`);
      break;

    case "PullRequestEvent":
      pullPorRepo[repo] = (pullPorRepo[repo] || 0) + 1;
      break;

    case "IssueCommentEvent":
      commIssuePorRepo[repo] = (commIssuePorRepo[repo] || 0) + 1;
      //console.log(`- ${username} comentó en el issue "${item.payload.issue.title}" en ${repo}.`,);
      break;

    default:
      console.log(`- ${username} realizó ${item.type} en ${repo}.`);
      break;
  }
}

for (const [repo, pushes] of Object.entries(pushPorRepo)) {
  console.log(`- ${username} pusheo ${pushes} veces en ${repo}.`);
}

for (const [repo, pulls] of Object.entries(pullPorRepo)) {
  console.log(`- ${username} hizo PR ${pulls} veces en ${repo}.`);
}

for (const [repo, issues] of Object.entries(commIssuePorRepo)) {
  console.log(`- ${username} comentó (issue) ${issues} veces en ${repo}.`);
}
