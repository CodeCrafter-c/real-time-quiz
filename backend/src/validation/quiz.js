import { z } from "zod";

const questionValidation = z.object({
  question: z
    .string()
    .trim()
    .min(1, "question is mandatory")
    .max(200, "question too long"),

  options: z
    .array(z.string().trim().min(1, "option cannot be empty"))
    .min(2, "at least two options are mandatory")
    .max(4, "at most 4 options are allowed"),

  correctAnswer: z
    .number({ required_error: "correct answer is required" })
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

  if (new Set(data.options).size !== data.options.length) {
    ctx.addIssue({
      path: ["options"],
      message: "options must be unique",
      code: z.ZodIssueCode.custom
    });
  }
});

const quizValidation = z.object({
  title: z.string().trim().min(1, "title is mandatory"),
  questions: z
    .array(questionValidation)
    .min(1, "at least one question is mandatory")
    .max(20, "maximum 20 questions allowed"),
});
export default quizValidation;
