import { useState } from "react";
import { FadeUp } from "../../components/AnimatedPresenceDiv";
import { ElementWithLabel } from "../../components/ElementWithLabel";
import { InputWithLabel } from "../../components/GenericInputWithLabel";
import { SectionSeparator } from "../../components/SectionSeparator";
import { Label } from "../../components/Label";
import { Button } from "../../components/Button";

export default function Profile() {
    const [isProfilePicHovered, sethovered] = useState(false);

    return (
        <FadeUp className="flex flex-col gap-4 items-center px-4 py-4 w-full">
            <h1 className="text-3xl font-bold text-black">Edit Profile</h1>

            <div className="px-2 py-2 w-full border border-orange-500/35 bg-orange-500/15 rounded-md">
                <span className="font-bold text-black">
                    Note: Temporary edit profile UI. Not the final version.<br></br>
                    Features are not implemented
                </span>
            </div>

            <div className="flex gap-4 items-center w-full">
                <div
                    className="relative w-[128px] h-[128px] md:w-[256px] md:h-[256px] cursor-pointer rounded-full"
                    onMouseEnter={() => sethovered(true)}
                    onMouseLeave={() => sethovered(false)}
                >
                    <span className="absolute md:top-0 md:left-0 top-[50%] left-[50%] transform -translate-x-1/2 -translate-y-1/2 md:translate-x-0 md:translate-y-0">
                        <svg
                            className="md:h-[256px] md:w-[256px] h-[128px] w-[128px]"
                            xmlns="http://www.w3.org/2000/svg"
                            viewBox="0 -960 960 960"
                            fill="#1f1f1f"
                        >
                            <path d="M234-276q51-39 114-61.5T480-360q69 0 132 22.5T726-276q35-41 54.5-93T800-480q0-133-93.5-226.5T480-800q-133 0-226.5 93.5T160-480q0 59 19.5 111t54.5 93Zm146.5-204.5Q340-521 340-580t40.5-99.5Q421-720 480-720t99.5 40.5Q620-639 620-580t-40.5 99.5Q539-440 480-440t-99.5-40.5ZM480-80q-83 0-156-31.5T197-197q-54-54-85.5-127T80-480q0-83 31.5-156T197-763q54-54 127-85.5T480-880q83 0 156 31.5T763-763q54 54 85.5 127T880-480q0 83-31.5 156T763-197q-54 54-127 85.5T480-80Zm100-95.5q47-15.5 86-44.5-39-29-86-44.5T480-280q-53 0-100 15.5T294-220q39 29 86 44.5T480-160q53 0 100-15.5ZM523-537q17-17 17-43t-17-43q-17-17-43-17t-43 17q-17 17-17 43t17 43q17 17 43 17t43-17Zm-43-43Zm0 360Z" />
                        </svg>
                    </span>
                    {isProfilePicHovered && (
                        <span className="absolute top-0 left-0 z-9 bg-black/50 flex items-center justify-center w-full h-full rounded-full">
                            <svg
                                xmlns="http://www.w3.org/2000/svg"
                                height="64px"
                                viewBox="0 -960 960 960"
                                width="64px"
                                fill="#fff"
                            >
                                <path d="M440-440ZM120-120q-33 0-56.5-23.5T40-200v-480q0-33 23.5-56.5T120-760h126l74-80h240v80H355l-73 80H120v480h640v-360h80v360q0 33-23.5 56.5T760-120H120Zm640-560v-80h-80v-80h80v-80h80v80h80v80h-80v80h-80ZM440-260q75 0 127.5-52.5T620-440q0-75-52.5-127.5T440-620q-75 0-127.5 52.5T260-440q0 75 52.5 127.5T440-260Zm0-80q-42 0-71-29t-29-71q0-42 29-71t71-29q42 0 71 29t29 71q0 42-29 71t-71 29Z" />
                            </svg>
                        </span>
                    )}
                </div>

                <div className="flex flex-col gap-2 flex-grow-1">
                    <InputWithLabel
                        label="Name"
                        placeholder="Your name..."
                        className="w-full"
                    ></InputWithLabel>
                    <ElementWithLabel
                        label="Bio"
                        element={
                            <textarea
                                className="w-full px-2 py-2 rounded-md border border-black/15 focus:outline-none focus:border-black/35 resize-none"
                                rows={2}
                                placeholder="Tell others a bit about yourself"
                                draggable={false}
                            ></textarea>
                        }
                    ></ElementWithLabel>
                </div>
            </div>

            <div className="flex flex-col gap-4">
                <SectionSeparator sectionName="Security"></SectionSeparator>
                <section>
                    <Label text="Password"></Label>
                    <p className="text-black">
                        For your own safety, your password is not shown here.{" "}
                        <a className="underline cursor-pointer">
                            Change Password
                        </a>
                    </p>
                </section>
                <section>
                    <Label text="Email"></Label>
                    <p>
                        Your email is ********@gmail.com (not real).{" "}
                        <a className="underline cursor-pointer">Change Email</a>
                    </p>
                </section>
            </div>
            <div className="w-full mt-10 py-2 border-b border-b-black/35">
                <span className="float-right">
                    <Button
                        icon={
                            <svg
                                xmlns="http://www.w3.org/2000/svg"
                                height="24px"
                                viewBox="0 -960 960 960"
                                width="24px"
                                fill="#fff"
                            >
                                <path d="M840-680v480q0 33-23.5 56.5T760-120H200q-33 0-56.5-23.5T120-200v-560q0-33 23.5-56.5T200-840h480l160 160Zm-80 34L646-760H200v560h560v-446ZM565-275q35-35 35-85t-35-85q-35-35-85-35t-85 35q-35 35-35 85t35 85q35 35 85 35t85-35ZM240-560h360v-160H240v160Zm-40-86v446-560 114Z" />
                            </svg>
                        }
                        text="Save"
                        isPrimary={true}
                    ></Button>
                </span>
            </div>
        </FadeUp>
    );
}
