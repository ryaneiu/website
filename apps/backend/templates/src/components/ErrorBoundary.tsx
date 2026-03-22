import type { ReactNode } from "react";
import React from "react";
import { Codeblock } from "./Codeblock";
import { Button } from "./Button";

interface Props {
    children: ReactNode;
}

type State = {
    hasError: boolean;
    stack: string;
    infoShown: boolean;
};

const FUNNY_MESSAGE = [
    "be ready for another session of debugging!",
    "ask ChatGPT to fix :D",
    "definitely not caused by my terrible code",
    "not me",
    "noop noop",
    "TypeScript didn't save you this time",
    "[funny message should go here]",
    "kill the bug",
    "look behind you",
    "turn it off and on again",
    "blame the compiler",
    "somebody call IT!!",
    "but it works on my machine!! *cries*",
    "hello darkness, my old friend",
    "is it Friday yet?",
    "press F to pay respects",
    "maybe coffee will help",
    "just a minor inconvenience",
    "this error is definitely a feature",
    "well, that's embarrassing",
    "console.log, your way to salvation",
    "why can't we have nice things",
    "oh look, another exception",
    "ChatGPT writing your code: 30 seconds\n// debugging it: 8 hours",
    "stackoverflow is not a solution",
    "asking Ai won't help",
    "did you ctrl+C, ctrl+V?",
    "your code is flawless. Or IS IT????? *vsauce music intensifies**"
]

export class ErrorBoundary extends React.Component<Props, State> {
    state: State = {
        hasError: false,
        stack: "",
        infoShown: false,
    };

    componentDidCatch(error: Error, errorInfo: React.ErrorInfo): void {
        console.error("React error: ", error, errorInfo);

        const funnyMessage = FUNNY_MESSAGE[Math.floor(Math.random() * FUNNY_MESSAGE.length)];


        const stackMessage = `
--- Error report ---
// ${funnyMessage}

> This error was caught by the React Error Boundary. 
  Therefore, the error most likely occurred in one of the React components.

**NAME**     : ${error.name}
**MESSAGE**  : ${error.message}
**CAUSE**    : ${error.cause}

--- STACK ---
${error.stack}

> To see a more detailed report, please check the dev console.
`;

        this.setState({
            stack: stackMessage,
        });
    }

    static getDerivedStateFromError(): State {
        return {
            hasError: true,
            stack: "Unknown cause & stack",
            infoShown: false,
        };
    }

    render(): ReactNode {
        if (this.state.hasError) {
            return (
                <div className="w-[100vw] h-[100vh] flex items-center justify-center">
                    <div className="px-8 py-8 border border-black/15 rounded-md flex flex-col gap-2">
                        <h1 className="font-bold text-3xl text-black text-center">
                            Application error occurred
                        </h1>
                        <p className="text-black/50 text-md text-center">
                            Try refreshing the page to fix this error.
                        </p>

                        {this.state.infoShown ? (
                            <>
                                <p className="text-center">
                                    <strong>Additional information: </strong>
                                </p>
                                <div className="flex flex-col w-full items-center">
                                    <div className="max-w-[40vw] max-h-[40vh] overflow-y-auto">
                                        <Codeblock>
                                            {this.state.stack}
                                        </Codeblock>
                                    </div>
                                </div>
                                <div className="w-full flex flex-col items-center">
                                    <Button text="Hide Details" onClick={() => {
                                        this.setState({infoShown: false});
                                    }}>

                                    </Button>

                                </div>
                            </>
                        ) : 
                        
                            <div className="w-full flex flex-col items-center">
                                                        <Button
                            text="Show details"
                            onClick={() => {
                                this.setState({ infoShown: true });
                            }}
                        ></Button>
                            </div>
                        }
                    </div>
                </div>
            );
        }
        return this.props.children;
    }
}
