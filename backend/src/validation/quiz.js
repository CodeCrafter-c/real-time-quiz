import { z } from "zod";

const questionValidation = z.object({
  question: z.string().trim().min(1, "question is mandatory"),

  options: z
    .array(z.string().trim().min(1, "option cannot be empty"))
    .min(2, "at least two options are mandatory")
    .max(4, "at most 4 options are allowed"),

  correctAnswer: z
    .number()
    .int()
    .nonnegative()
}).superRefine((data, ctx) => {
  if (data.correctAnswer >= data.options.length) {
    ctx.addIssue({
      path: ["correctAnswer"],
      message: "correct answer index must be within options range",
      code: z.ZodIssueCode.custom
    });
  }
});

const quizValidation = z
  .array(questionValidation)
  .min(1, "at least one question is mandatory");

export default quizValidation;