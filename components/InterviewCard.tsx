import Image from "next/image";
import { Button } from "./ui/button";
import dayjs from "dayjs";
import { cn, getRandomInterviewCover } from "@/lib/utils";
import Link from "next/link";
import DisplayTechIcons from "./DisplayTechIcons";

const InterviewCard = ({type, techstack, role, interviewId, userId, createdAt} : InterviewCardProps) => {
    const feedback = null as Feedback | null;

    const normalizedType = /mix/gi.test(type) ? "Mixed" : type;

    const badgeColor =
    {
      Behavioral: "bg-light-400",
      Mixed: "bg-light-600",
      Technical: "bg-light-800",
    }[normalizedType] || "bg-light-600";

    const formattedDate = dayjs(
        feedback?.createdAt || createdAt || Date.now()
    ).format("MMM D, YYYY")
  return (
    <div className="card-border w-[360px] max-sm:w-full min-h-96">
        <div className="card-interview">
            <div>
                <div className={cn(
              "absolute top-0 right-0 w-fit px-4 py-2 rounded-bl-lg",
              badgeColor
            )}>
                    <p className="badge-text ">{normalizedType}</p> 
                </div>        
                
                <Image src={getRandomInterviewCover()} alt="Company logo" width={90} height={90} className="rounded-full object-fit size-[90px]"/>

                <h3 className="mt-5 capitalize"> 
                    {role} Interview
                </h3>

                <div className="flex flex-row gap-5 mt-3">
                    <div className="flex flex-row gap-2">
                        <Image src="/calendar.svg" alt="date" width={22} height={22} />
                        <p>{formattedDate}</p>
                    </div>
                    <div className="flex flex-row gap-2 items-center">
                        <Image src="/star.svg" alt="score" width={22} height={22} />
                        <p>{feedback?.totalScore || '---'}/100</p>
                    </div>
                </div>

                <p className="line-clamp-2 mt-5">
                    {feedback?.finalAssessment || "You haven't taken the interview yet. Take it now to improve your skills."}
                </p>
            </div>

            <div className="flex flex-row justify-between">
                <DisplayTechIcons techStack={techstack} /> 

                <Button> 
                    <Link href={feedback ? `/interview/${interviewId}/feedback` : `/interview/${interviewId}`}>
                        {feedback ? 'Check Feedback' : 'View Interview'}
                    </Link>
                </Button>
            </div>
        </div>
        
    </div>
  )
}

export default InterviewCard