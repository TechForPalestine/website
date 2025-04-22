import * as React from 'react';
import FAQAccordion from './FAQAccordion';
import { Link, Typography } from '@mui/material';
import ResourceList from './ResourceList';

const resourceSections = [
    {
        name: 'Recruitment Organizations',
        resources: [
            {
                name: 'Apricot',
                url: 'https://apricotinternational.org/',
                logo: '/apricot.jpg',
                description: `Experienced MENA Engineers delivering results and contributing to your product's growth immediately.`,
            },
            {
                name: 'MENA Alliances',
                url: 'https://menaalliances.com/jobsforpalestine/',
                logo: '/mena-alliances-logo.webp',
                description: `Empowering Palestinian Professionals With Job Opportunities`,
            },
            {
                name: 'Gaza Sky Geeks',
                url: 'https://gazaskygeeks.com/',
                logo: '/gaza-sky-geeks-logo.png',
                description: `A leading tech hub in Gaza and the West Bank, fostering the digital economy and future technology leaders since 2011.`,
            },
            {
                name: 'Manara.tech',
                url: 'https://manara.tech/tech-jobs-for-palestine',
                logo: '/manara.png',
                description: `Built to connect top tech talent in the MENA region to global jobs.`,
            },
            {
                name: 'Rising from Ashes',
                url: 'https://bees.to/hire-ps/',
                logo: '/bees-logo-horizontal.webp',
                description: `Connects global companies with remote workers in Palestine via partners like Bees, Flow Accelerator, and GSG.`,
            },
            {
                name: 'TAP',
                url: 'https://www.tapcareers.io/',
                logo: '/tap-logo.svg',
                description: `A career accelerator in Palestine and Jordan offering remote-ready talent.`,
            },
            {
                name: 'Techtative',
                url: 'https://techtative.io/',
                logo: '/techtative-logo.png',
                description: `Premier EOR in Palestine, enabling global orgs to tap into local expertise.`,
            },
            {
                name: 'Olives and Heather',
                url: 'https://www.olivesandheather.com/',
                logo: '/olives-and-heather.png',
                description: `Empowers a new generation of Palestinian marketers through global marketing excellence.`,
            },
            {
                name: 'Gaza Talents',
                url: 'https://gazatalents.com/en',
                logo: '/gazatalents.png',
                description: `Provide quick access for those seeking Professional Skills from Gaza.`,
            },{
                name: 'Youmna',
                url: 'https://www.withyoumna.com/',
                logo: '/youmna.png',
                description: `Achieve more with a proactive, remote Executive Assistant who acts as your "right hand".`,
            },
        ]
    },
    {
        name: 'Freelance',
        resources: [
            {
                name: 'Dribble',
                url: 'https://dribbble.com/freelance-ux-designers-for-hire-gaza-ps',
                logo: '/dribbble-logo.png',
                description: `UX designers from Gaza offering freelance services.`,
            },
            {
                name: 'Upwork',
                url: 'https://www.upwork.com/hire/ps/',
                logo: '/upwork.png', // SVG string if desired
                description: `Hire freelancers from Palestine through Upwork.`,
            },
        ]
    }
];

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
    {
        question: 'How do I hire Palestinians?',
        answer: (
            <>

                <ResourceList  sections={resourceSections}  />

            </>
        )
    }
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
