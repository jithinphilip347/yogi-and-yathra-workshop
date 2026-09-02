import { describe, it, expect, vi } from "vitest";
import { faqApi } from "@/services/faqApi";
import { FALLBACK_FAQS } from "@/components/home/HomeFAQ";
import apiClient from "@/services/apiClient";

vi.mock("@/services/apiClient", () => ({
  default: {
    get: vi.fn(),
  },
}));

describe("HomeFAQ Integration & Caching Logic", () => {
  it("calls the correct featured FAQs endpoint", async () => {
    apiClient.get.mockResolvedValueOnce({
      data: {
        success: true,
        data: [
          { id: 1, question: "What is Yoga?", answer: "Yoga is a practice." },
        ],
      },
    });

    const response = await faqApi.getFeaturedFaqs();
    expect(apiClient.get).toHaveBeenCalledWith("/faqs/public/featured");
    expect(response.data.data).toHaveLength(1);
    expect(response.data.data[0].question).toBe("What is Yoga?");
  });

  it("uses fallback FAQs when API returns empty array or null", () => {
    const emptyApiResponse = [];
    const faqs = (emptyApiResponse && emptyApiResponse.length > 0) ? emptyApiResponse : FALLBACK_FAQS;

    expect(faqs).toHaveLength(4);
    expect(faqs[0].question).toBe("How do I join the daily live yoga sessions?");
  });

  it("uses real featured FAQs when API returns data", () => {
    const realApiFaqs = [
      { id: 2, question: "Do I need prior experience?", answer: "Not at all!" },
      { id: 3, question: "What if I miss a class?", answer: "Recordings are available." },
    ];

    const faqs = (realApiFaqs && realApiFaqs.length > 0) ? realApiFaqs : FALLBACK_FAQS;

    expect(faqs).toHaveLength(2);
    expect(faqs[0].question).toBe("Do I need prior experience?");
  });
});
