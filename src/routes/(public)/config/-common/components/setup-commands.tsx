import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
} from "@/components/ui/accordion";

type SetupCommandsProps = {
    children: React.ReactNode;
};

export const SetupCommands = ({ children }: SetupCommandsProps) => {
    return (
        <Accordion>
            <AccordionItem>
                <AccordionTrigger>Exact commands</AccordionTrigger>
                <AccordionContent>{children}</AccordionContent>
            </AccordionItem>
        </Accordion>
    );
};
