import * as React from 'react';
import FAQAccordion from './FAQAccordion';
import { Link, Typography } from '@mui/material';

const faqs = [
    {
        question: 'Can Tech for Palestine help our non-profit build an app or website?',
        answer: (
            <>
                Our partner{' '}
                <Link
                    href="https://techtotherescue.org/"
                    target="_blank"
                    rel="noopener noreferrer"
                >
                    Tech to the Rescue
                </Link>{' '}
                is the right place for that. They will partner you with a tech company, typically within 6 weeks, who will work with you to build what you need for free.{' '}
                <Link
                    href="https://techtotherescue.org/"
                    target="_blank"
                    rel="noopener noreferrer"
                >
                    You can sign up for help here.
                </Link>
            </>
        )
    },

];

export default function FAQList() {
    return (
        <div>
            {faqs.map((faq, index) => (
                <FAQAccordion key={index} question={faq.question} answer={faq.answer} />
            ))}
        </div>
    );
}
