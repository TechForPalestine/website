import * as React from 'react';
import FAQAccordion from './FAQAccordion';
import { Link, Typography } from '@mui/material';

const faqs = [
    {
        question: 'Can Tech for Palestine help our non-profit build an app or website?',
        answer: (
            <>
                <Typography>
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
                </Typography>
            </>
        )
    },
        {
        question: 'How can I get help securing our devices or digital service?',
        answer: (
            <>
                <Typography>
                    Our partner{' '}
                    <Link
                        href="https://www.accessnow.org/help/"
                        target="_blank"
                        rel="noopener noreferrer"
                    >
                        Access Now
                    </Link>{' '}
                    provides digital security support for civil society organizations, 
                    activists, media, human rights defenders. They can help provide rapid 
                    response for security incidents, work with you to improve your organization's 
                    security profile, and many other security-related issues. Reach out to their{' '}
                    <Link
                        href="https://www.accessnow.org/help/#contact-us"
                        target="_blank"
                        rel="noopener noreferrer"
                    >
                    helpline
                    </Link>{' '}
                    and you should get a response within 2 hours.
                </Typography>
            </>
        )
    },
    {
        question: 'Where can I get graphical resources about Palestine for my advocacy work?',
        answer: (
            <>
                <Typography>
                    <Link
                        href="https://visualizingpalestine.org/"
                        target="_blank"
                        rel="noopener noreferrer"
                    >
                        Visualizing Palestine
                    </Link>{' '}
                    produces graphics which are freely available and are intended to be used by advocates and educators. Hundreds of{' '}
                    <Link
                        href="https://visualizingpalestine.org/visuals"
                        target="_blank"
                        rel="noopener noreferrer"
                    >
                        high quality graphics
                    </Link>{' '}
                    are available and can be used on social media and in education resources for free and without advanced permission.
                </Typography>
                <Typography sx={{ mt: 4}}>
                    Visualizing Palestine uses data and research to visually communicate Palestinian experiences to provoke narrative change. Their freely available digital and print visuals tell the story of Palestinians' dispossession, apartheid and genocide.
                </Typography>
            </>
        )
    },
    {
        question: 'How do I hire Palestinians?',
        answer: (
            <>

                <Typography>
                    Please visit our{' '}
                    <Link href="/help/hire" underline="hover">
                        Hire Palestinians
                    </Link>{' '}
                    page to find trusted organizations and platforms for hiring Palestinian talent.
                </Typography>
            </>
        )
    }
];


export default function FAQList() {
    return (
        <div class={'mt-6'}>
            {faqs.map((faq, index) => (
                <FAQAccordion key={index} question={faq.question} answer={faq.answer} />
            ))}
        </div>
    );
}
