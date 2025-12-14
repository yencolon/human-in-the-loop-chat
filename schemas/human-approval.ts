import z from "zod";

export const humanApprovalResponseSchema = z.object({
  approved: z
    .boolean()
    .describe("Whether the human approved the proposed solution"),
  comment: z
    .string()
    .optional()
    .describe("Optional comment from the human agent"),
});

export const askHumanSchema = z.object({
  customerName: z.string().describe("The name of the customer"),
  issue: z.string().describe("The customer's issue"),
  proposedSolution: z.string().describe("The proposed solution"),
});
