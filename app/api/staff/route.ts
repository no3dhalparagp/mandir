/**
 * Staff Management API
 */

import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { NextRequest, NextResponse } from "next/server";

// GET all staff
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const staff = await prisma.staffDetail.findMany({
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(staff);
  } catch (error) {
    console.error("[v0] Staff GET error:", error);
    return NextResponse.json(
      { error: "Failed to fetch staff" },
      { status: 500 }
    );
  }
}

// POST create staff details
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const data = await request.json();
    const {
      userId,
      designation,
      department,
      employeeCode,
      dateOfJoining,
      dateOfBirth,
      bankName,
      accountNumber,
      ifscCode,
      accountHolderName,
      personalMobile,
      alternateEmail,
      panCard,
      aadharCard,
      salary,
      notes,
    } = data;

    // Check if staff details already exist for user
    const existing = await prisma.staffDetail.findUnique({
      where: { userId },
    });

    if (existing) {
      return NextResponse.json(
        { error: "Staff details already exist for this user" },
        { status: 400 }
      );
    }

    const staffDetail = await prisma.staffDetail.create({
      data: {
        userId,
        designation,
        department,
        employeeCode,
        dateOfJoining: dateOfJoining ? new Date(dateOfJoining) : null,
        dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : null,
        bankName,
        accountNumber,
        ifscCode,
        accountHolderName,
        personalMobile,
        alternateEmail,
        panCard,
        aadharCard,
        salary: salary ? parseFloat(salary) : null,
        notes,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    return NextResponse.json(staffDetail, { status: 201 });
  } catch (error) {
    console.error("[v0] Staff POST error:", error);
    return NextResponse.json(
      { error: "Failed to create staff details" },
      { status: 500 }
    );
  }
}
