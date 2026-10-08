import { runCollectors } from "../src/server/collector";

runCollectors(true)
  .then((results) => {
    console.log(results);
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
