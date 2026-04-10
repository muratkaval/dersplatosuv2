"use client";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface FaqItem {
  q: string;
  a: string;
}

interface FAQSectionProps {
  items: FaqItem[];
  accentColor?: string;
}

export default function FAQSection({ items, accentColor = "#4289F7" }: FAQSectionProps) {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  return (
    <div className="faq-list">
      {items.map((item, i) => (
        <div key={i} className={`faq-item ${openIndex === i ? "faq-open" : ""}`}>
          <button
            className="faq-question"
            onClick={() => setOpenIndex(openIndex === i ? null : i)}
            style={openIndex === i ? { color: accentColor } : {}}
          >
            <span className="faq-icon" style={openIndex === i ? { background: accentColor, color: "#fff" } : {}}>
              {openIndex === i ? "−" : "+"}
            </span>
            {item.q}
          </button>
          <AnimatePresence>
            {openIndex === i && (
              <motion.div
                className="faq-answer"
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.3, ease: "easeInOut" }}
              >
                <div className="faq-answer-inner">{item.a}</div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      ))}
    </div>
  );
}
