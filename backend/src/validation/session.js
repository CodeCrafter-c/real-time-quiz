import { z } from "zod";

const sessionValidation=z.object({
  type:z.enum(["quiz","poll","open_ended"]),
  id:z.string(),
})
export default sessionValidation