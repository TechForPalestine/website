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
    },
    {
        question: 'Which VCs can I take money from?',
        answer: (
            <>
                <Typography>
                    Venture capital as an industry is highly zionist and it can be very tough to find values-aligned Silicon Valley investors. Remember that you can never get rid of VCs who you work with (angels are less bad, as they get less rights and make smaller investments).
                </Typography>
                <Typography sx={{ mt: 2 }}>
                    As a strategy, we recommend raising from trusted angels and getting to cash flow positive to avoid VC. There are some VCs you can trust, but once you're in the VC system you will need to keep growing at incredible rates, and to raise new money each year to grow beyond what you can afford with revenue. This will put you in very low-leverage situations that impact your ability to make decisions based on your values.
                </Typography>
                <Typography sx={{ mt: 2 }}>
                    That said, if you do want to raise from VCs, this is our approach. Run checks on VCs:
                </Typography>
                <Typography component="ul" sx={{ mt: 1, pl: 3, listStyleType: 'disc' }}>
                    <li>are they on our list?{' '}
                        <Link
                            href="https://github.com/TechForPalestine/antipalestinian-vc-funds"
                            target="_blank"
                            rel="noopener noreferrer"
                        >
                            Antipalestinian VC funds list
                        </Link>
                        <Typography component="ul" sx={{ mt: 1, pl: 2, listStyleType: 'circle' }}>
                            <li>Note that the list is not super up-to-date -- we welcome PRs to improve it</li>
                             <Typography component="ul" sx={{ mt: 1, pl: 2, listStyleType: 'circle' }}> 
                                <li>Firms who signed the "Venture Capital Community Statement of Support for Israel" may not be out-and-out zionists.</li>
                             </Typography>
                        </Typography>
                    </li>
                    <li style={{ marginTop: '8px' }}>You may search the partner and firm's statements (and possibly other partners) on Twitter and LinkedIn, using the search terms "israel", "gaza", "tel aviv", "anti-semitism", "antisemitism". Extended search terms include "miami", "china", "islam", "muslim", "migration", "illegal", "8200". You can also search on Instagram and Facebook if they use them.</li>
                </Typography>
                <Typography sx={{ mt: 2 }}>
                    You're looking for 3 things:
                </Typography>
                <Typography component="ul" sx={{ mt: 1, pl: 3, listStyleType: 'disc' }}>
                    <li>Do they sympathize with Palestinian, are they anti-genocide, are they pro-humanity?</li>
                    <li>Do they make investments with Israel, speak about Israeli startups or the startup ecosystem, or generally support Israel?</li>
                    <li>Have they taken part in Israeli propaganda (taking part in Israeli-organized talking points about anti-semitism at universities)?</li>
                </Typography>
                <Typography sx={{ mt: 2 }}>
                    If you have a good relationship with them, and are feeling brave, then you can broach the topic and see if they sympathize with Palestine or Palestinians. If they have said something which raises suspicion for you, you can discuss your stance and see their response. Though you may not always find clarity here, it might lower your opinion of them enough to pick someone else.
                </Typography>
            </>
        )
    }
];


export default function FAQList() {
    return (
        <div className={'mt-6'}>
            {faqs.map((faq, index) => (
                <FAQAccordion key={index} question={faq.question} answer={faq.answer} />
            ))}
        </div>
    );
}
