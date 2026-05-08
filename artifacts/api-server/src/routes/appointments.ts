import { Router } from "express";
import {
  db,
  appointmentTypesTable,
  questionsTable,
  usersTable,
  businessesTable,
  businessMembersTable,
  eq,
  like,
  and,
  inArray,
} from "@workspace/db";
import {
  CreateAppointmentBody,
  UpdateAppointmentBody,
  PublishAppointmentBody,
  AddQuestionBody,
} from "@workspace/api-zod";
import { requireAuth, requireRole, generateToken, type AuthRequest } from "../lib/auth";

const router = Router();

function firstParam(value: string | string[]) {
  return Array.isArray(value) ? value[0] : value;
}

function userToObj(u: typeof usersTable.$inferSelect) {
  return {
    id: u.id, fullName: u.fullName, email: u.email, role: u.role,
    isActive: u.isActive, isVerified: u.isVerified, createdAt: u.createdAt.toISOString(),
  };
}

function bizToObj(b: typeof businessesTable.$inferSelect) {
  return {
    id: b.id, name: b.name, slug: b.slug, description: b.description,
    category: b.category, logoUrl: b.logoUrl, city: b.city, country: b.country,
    ownerId: b.ownerId, isActive: b.isActive, isVerified: b.isVerified,
    createdAt: b.createdAt.toISOString(),
  };
}

async function appointmentToResponse(
  apt: typeof appointmentTypesTable.$inferSelect,
  organiser?: typeof usersTable.$inferSelect,
  questions?: typeof questionsTable.$inferSelect[],
  business?: typeof businessesTable.$inferSelect
) {
  return {
    id: apt.id, businessId: apt.businessId,
    business: business ? bizToObj(business) : undefined,
    title: apt.title, description: apt.description, duration: apt.duration,
    isPublished: apt.isPublished, scheduleType: apt.scheduleType,
    manageCapacity: apt.manageCapacity, maxCapacity: apt.maxCapacity,
    advancePayment: apt.advancePayment,
    paymentAmount: apt.paymentAmount ? parseFloat(apt.paymentAmount) : null,
    manualConfirmation: apt.manualConfirmation, assignmentType: apt.assignmentType,
    location: apt.location, resourceType: apt.resourceType,
    workingHours: apt.workingHours,
    organiser: organiser ? userToObj(organiser) : undefined,
    questions: questions?.map((q) => ({
      id: q.id, appointmentId: q.appointmentId, question: q.question,
      questionType: q.questionType, isRequired: q.isRequired, options: q.options,
    })),
    createdAt: apt.createdAt.toISOString(),
  };
}

// GET /appointments
router.get("/appointments", async (req: AuthRequest, res) => {
  const { published, search, businessId } = req.query;
  let apts = await db.select().from(appointmentTypesTable);

  if (req.user && req.user.role === "organiser") {
    const myBusinesses = await db.select({ id: businessesTable.id }).from(businessesTable).where(eq(businessesTable.ownerId, req.user.id));
    const myBusinessIds = myBusinesses.map((b) => b.id);
    if (myBusinessIds.length === 0) { apts = []; }
    else { apts = apts.filter((a) => a.businessId !== null && myBusinessIds.includes(a.businessId)); }
    if (published !== undefined) {
      const pub = published === "true";
      apts = apts.filter((a) => a.isPublished === pub);
    }
  } else if (req.user && req.user.role === "admin") {
    if (published !== undefined) {
      const pub = published === "true";
      apts = apts.filter((a) => a.isPublished === pub);
    }
  } else {
    apts = apts.filter((a) => a.isPublished);
  }

  const businessIdParam = Array.isArray(businessId) ? businessId[0] : businessId;
  if (businessIdParam) {
    apts = apts.filter((a) => a.businessId === parseInt(businessIdParam as string));
  }
  const searchParam = Array.isArray(search) ? search[0] : search;
  if (searchParam && typeof searchParam === "string") {
    const q = searchParam.toLowerCase();
    apts = apts.filter((a) => a.title.toLowerCase().includes(q));
  }

  const results = await Promise.all(
    apts.map(async (apt) => {
      const [organiser] = await db.select().from(usersTable).where(eq(usersTable.id, apt.organiserId)).limit(1);
      const [business] = await db.select().from(businessesTable).where(eq(businessesTable.id, apt.businessId)).limit(1);
      return appointmentToResponse(apt, organiser, undefined, business);
    })
  );
  res.json(results);
});

// POST /appointments
router.post("/appointments", requireAuth, requireRole("organiser", "admin"), async (req: AuthRequest, res) => {
  const parsed = CreateAppointmentBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "ValidationError", message: parsed.error.message });
    return;
  }
  const insertData = {
    ...parsed.data,
    organiserId: req.user!.id,
    shareToken: generateToken(),
    paymentAmount: parsed.data.paymentAmount ? parsed.data.paymentAmount.toString() : null,
  };
  const result = await db.insert(appointmentTypesTable).values(insertData as any);
  const insertId = Number((result as any)[0].insertId);
  const [apt] = await db.select().from(appointmentTypesTable).where(eq(appointmentTypesTable.id, insertId)).limit(1);
  const [organiser] = await db.select().from(usersTable).where(eq(usersTable.id, apt.organiserId)).limit(1);
  const [business] = await db.select().from(businessesTable).where(eq(businessesTable.id, apt.businessId)).limit(1);
  res.status(201).json(await appointmentToResponse(apt, organiser, [], business));
});

// GET /appointments/:appointmentId
router.get("/appointments/:appointmentId", async (req: AuthRequest, res) => {
  const id = parseInt(firstParam(req.params.appointmentId), 10);
  const [apt] = await db.select().from(appointmentTypesTable).where(eq(appointmentTypesTable.id, id)).limit(1);
  if (!apt) {
    res.status(404).json({ error: "NotFound", message: "Appointment type not found" });
    return;
  }
  const [organiser] = await db.select().from(usersTable).where(eq(usersTable.id, apt.organiserId)).limit(1);
  const [business] = await db.select().from(businessesTable).where(eq(businessesTable.id, apt.businessId)).limit(1);
  const questions = await db.select().from(questionsTable).where(eq(questionsTable.appointmentId, id));
  res.json(await appointmentToResponse(apt, organiser, questions, business));
});

// PUT /appointments/:appointmentId
router.put("/appointments/:appointmentId", requireAuth, requireRole("organiser", "admin"), async (req: AuthRequest, res) => {
  const id = parseInt(firstParam(req.params.appointmentId), 10);
  const parsed = UpdateAppointmentBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "ValidationError", message: parsed.error.message });
    return;
  }
  const updateData = {
    ...parsed.data,
    paymentAmount: parsed.data.paymentAmount !== undefined ? parsed.data.paymentAmount.toString() : undefined,
  };
  await db.update(appointmentTypesTable).set(updateData as any).where(eq(appointmentTypesTable.id, id));
  const [apt] = await db.select().from(appointmentTypesTable).where(eq(appointmentTypesTable.id, id)).limit(1);
  if (!apt) {
    res.status(404).json({ error: "NotFound", message: "Appointment type not found" });
    return;
  }
  const [organiser] = await db.select().from(usersTable).where(eq(usersTable.id, apt.organiserId)).limit(1);
  const [business] = await db.select().from(businessesTable).where(eq(businessesTable.id, apt.businessId)).limit(1);
  const questions = await db.select().from(questionsTable).where(eq(questionsTable.appointmentId, id));
  res.json(await appointmentToResponse(apt, organiser, questions, business));
});

// DELETE /appointments/:appointmentId
router.delete("/appointments/:appointmentId", requireAuth, requireRole("organiser", "admin"), async (req: AuthRequest, res) => {
  const id = parseInt(firstParam(req.params.appointmentId), 10);
  await db.delete(appointmentTypesTable).where(eq(appointmentTypesTable.id, id));
  res.status(204).send();
});

// POST /appointments/:appointmentId/publish
router.post("/appointments/:appointmentId/publish", requireAuth, requireRole("organiser", "admin"), async (req: AuthRequest, res) => {
  const id = parseInt(firstParam(req.params.appointmentId), 10);
  const parsed = PublishAppointmentBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "ValidationError", message: parsed.error.message });
    return;
  }
  await db.update(appointmentTypesTable).set({ isPublished: parsed.data.isPublished }).where(eq(appointmentTypesTable.id, id));
  const [apt] = await db.select().from(appointmentTypesTable).where(eq(appointmentTypesTable.id, id)).limit(1);
  if (!apt) {
    res.status(404).json({ error: "NotFound", message: "Appointment not found" });
    return;
  }
  const [business] = await db.select().from(businessesTable).where(eq(businessesTable.id, apt.businessId)).limit(1);
  res.json(await appointmentToResponse(apt, undefined, undefined, business));
});

// GET /appointments/:appointmentId/share-link
router.get("/appointments/:appointmentId/share-link", requireAuth, requireRole("organiser", "admin"), async (req: AuthRequest, res) => {
  const id = parseInt(firstParam(req.params.appointmentId), 10);
  const [apt] = await db.select().from(appointmentTypesTable).where(eq(appointmentTypesTable.id, id)).limit(1);
  if (!apt) {
    res.status(404).json({ error: "NotFound", message: "Appointment not found" });
    return;
  }
  const token = apt.shareToken || generateToken();
  if (!apt.shareToken) {
    await db.update(appointmentTypesTable).set({ shareToken: token }).where(eq(appointmentTypesTable.id, id));
  }
  res.json({ token, link: `/book/${id}?token=${token}` });
});

// GET /appointments/:appointmentId/questions
router.get("/appointments/:appointmentId/questions", async (req, res) => {
  const id = parseInt(firstParam(req.params.appointmentId), 10);
  const questions = await db.select().from(questionsTable).where(eq(questionsTable.appointmentId, id));
  res.json(
    questions.map((q) => ({
      id: q.id, appointmentId: q.appointmentId, question: q.question,
      questionType: q.questionType, isRequired: q.isRequired, options: q.options,
    }))
  );
});

// POST /appointments/:appointmentId/questions
router.post("/appointments/:appointmentId/questions", requireAuth, requireRole("organiser", "admin"), async (req, res) => {
  const id = parseInt(firstParam(req.params.appointmentId), 10);
  const parsed = AddQuestionBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "ValidationError", message: parsed.error.message });
    return;
  }
  const result = await db.insert(questionsTable).values({
    appointmentId: id,
    question: parsed.data.question,
    questionType: parsed.data.questionType,
    isRequired: parsed.data.isRequired,
    options: parsed.data.options,
  });
  const qId = Number((result as any)[0].insertId);
  const [question] = await db.select().from(questionsTable).where(eq(questionsTable.id, qId)).limit(1);
  res.status(201).json({
    id: question.id, appointmentId: question.appointmentId, question: question.question,
    questionType: question.questionType, isRequired: question.isRequired, options: question.options,
  });
});

export default router;
