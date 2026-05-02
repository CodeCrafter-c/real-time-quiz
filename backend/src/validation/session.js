import { z } from "zod";

const sessionValidation=z.object({
  type:z.enum(["Quiz","Poll","Open ended"]),
  id:z.string(),
})
export default sessionValidation