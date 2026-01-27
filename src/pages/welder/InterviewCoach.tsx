import { useState } from "react";
import { DashboardLayout } from "@/components/layouts/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { toast } from "@/hooks/use-toast";
import { WeldingLoadingAnimation } from "@/components/ai/WeldingLoadingAnimation";
import { ScoreCircle, StatCard } from "@/components/ai/ScoreCircle";
import {
  interviewCoach,
  GenerateQuestionsRequest,
  GenerateQuestionsResponse,
  EvaluateAnswerResponse,
  GetSummaryResponse,
  InterviewQuestion,
  InterviewResponse,
  getGradeColor,
} from "@/lib/ai-features";
import {
  JOB_TITLES,
  EXPERIENCE_LEVELS,
  QUESTION_TYPES,
  DIFFICULTY_LEVELS,
  WELD_PROCESSES_FULL,
  CERTIFICATIONS_LIST,
} from "@/constants/aiFeatureOptions";
import {
  Mic,
  MicOff,
  Send,
  SkipForward,
  Clock,
  CheckCircle2,
  XCircle,
  Lightbulb,
  Trophy,
  Target,
  ChevronRight,
  RotateCcw,
  Download,
  Home,
  Play,
  Sparkles,
} from "lucide-react";
import { cn } from "@/lib/utils";

type InterviewState = "setup" | "interview" | "feedback" | "summary";

export default function InterviewCoach() {
  const [state, setState] = useState<InterviewState>("setup");
  const [isLoading, setIsLoading] = useState(false);
  
  // Setup state
  const [jobTitle, setJobTitle] = useState("");
  const [experienceLevel, setExperienceLevel] = useState<"entry" | "intermediate" | "senior" | "expert">("intermediate");
  const [selectedProcesses, setSelectedProcesses] = useState<string[]>([]);
  const [selectedCerts, setSelectedCerts] = useState<string[]>([]);
  const [questionCount, setQuestionCount] = useState("5");
  const [difficulty, setDifficulty] = useState<"easy" | "medium" | "hard">("medium");
  const [selectedTypes, setSelectedTypes] = useState<string[]>(["technical", "behavioral", "safety"]);

  // Interview state
  const [questions, setQuestions] = useState<InterviewQuestion[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [userAnswer, setUserAnswer] = useState("");
  const [responses, setResponses] = useState<InterviewResponse[]>([]);
  const [timeRemaining, setTimeRemaining] = useState(120);

  // Feedback state
  const [currentFeedback, setCurrentFeedback] = useState<EvaluateAnswerResponse | null>(null);
  const [showIdealAnswer, setShowIdealAnswer] = useState(false);

  // Summary state
  const [summary, setSummary] = useState<GetSummaryResponse | null>(null);

  const toggleProcess = (process: string) => {
    setSelectedProcesses((prev) =>
      prev.includes(process)
        ? prev.filter((p) => p !== process)
        : [...prev, process]
    );
  };

  const toggleCert = (cert: string) => {
    setSelectedCerts((prev) =>
      prev.includes(cert)
        ? prev.filter((c) => c !== cert)
        : [...prev, cert]
    );
  };

  const toggleType = (type: string) => {
    setSelectedTypes((prev) =>
      prev.includes(type)
        ? prev.filter((t) => t !== type)
        : [...prev, type]
    );
  };

  const handleStartInterview = async () => {
    if (!jobTitle || selectedProcesses.length === 0) {
      toast({
        title: "Missing Information",
        description: "Please select a job title and at least one welding process",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      const response = await interviewCoach({
        action: "generate",
        jobTitle,
        requiredProcesses: selectedProcesses,
        requiredCerts: selectedCerts,
        experienceLevel,
        questionCount: parseInt(questionCount),
        questionTypes: selectedTypes as GenerateQuestionsRequest["questionTypes"],
        difficulty,
      }) as GenerateQuestionsResponse;

      if (response.success && response.data.questions.length > 0) {
        setQuestions(response.data.questions);
        setCurrentQuestionIndex(0);
        setResponses([]);
        setState("interview");
        setTimeRemaining(response.data.questions[0].timeLimit || 120);
      } else {
        throw new Error("No questions generated");
      }
    } catch (error) {
      console.error("Interview setup error:", error);
      toast({
        title: "Setup Failed",
        description: "Unable to generate interview questions. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmitAnswer = async () => {
    if (!userAnswer.trim()) {
      toast({
        title: "Empty Answer",
        description: "Please provide an answer before submitting",
        variant: "destructive",
      });
      return;
    }

    const currentQuestion = questions[currentQuestionIndex];
    
    setIsLoading(true);
    try {
      const response = await interviewCoach({
        action: "evaluate",
        question: currentQuestion.question,
        answer: userAnswer,
        jobTitle,
      }) as EvaluateAnswerResponse;

      if (response.success) {
        setCurrentFeedback(response);
        setResponses((prev) => [
          ...prev,
          {
            question: currentQuestion.question,
            answer: userAnswer,
            score: response.data.score,
          },
        ]);
        setState("feedback");
      } else {
        throw new Error("Evaluation failed");
      }
    } catch (error) {
      console.error("Answer evaluation error:", error);
      toast({
        title: "Evaluation Failed",
        description: "Unable to evaluate your answer. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleNextQuestion = () => {
    setUserAnswer("");
    setCurrentFeedback(null);
    setShowIdealAnswer(false);

    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex((prev) => prev + 1);
      setTimeRemaining(questions[currentQuestionIndex + 1].timeLimit || 120);
      setState("interview");
    } else {
      handleGetSummary();
    }
  };

  const handleSkipQuestion = () => {
    const currentQuestion = questions[currentQuestionIndex];
    setResponses((prev) => [
      ...prev,
      {
        question: currentQuestion.question,
        answer: "(Skipped)",
        score: 0,
      },
    ]);
    handleNextQuestion();
  };

  const handleGetSummary = async () => {
    setIsLoading(true);
    try {
      const response = await interviewCoach({
        action: "summary",
        jobTitle,
        responses,
      }) as GetSummaryResponse;

      if (response.success) {
        setSummary(response);
        setState("summary");
      } else {
        throw new Error("Summary generation failed");
      }
    } catch (error) {
      console.error("Summary error:", error);
      toast({
        title: "Summary Failed",
        description: "Unable to generate interview summary.",
        variant: "destructive",
      });
      setState("summary");
    } finally {
      setIsLoading(false);
    }
  };

  const handleRestart = () => {
    setState("setup");
    setQuestions([]);
    setCurrentQuestionIndex(0);
    setUserAnswer("");
    setResponses([]);
    setCurrentFeedback(null);
    setSummary(null);
  };

  const currentQuestion = questions[currentQuestionIndex];
  const progress = questions.length > 0 ? ((currentQuestionIndex + 1) / questions.length) * 100 : 0;

  if (isLoading) {
    return (
      <DashboardLayout userType="welder">
        <div className="h-[calc(100vh-4rem)] flex items-center justify-center">
          <WeldingLoadingAnimation
            message={
              state === "setup"
                ? "Generating interview questions..."
                : state === "interview"
                ? "Evaluating your answer..."
                : "Preparing your summary..."
            }
            variant="spark"
            size="lg"
          />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout userType="welder">
      <div className="p-6 max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-12 h-12 rounded-xl bg-accent/10 flex items-center justify-center">
              <Mic className="w-6 h-6 text-accent" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">AI Interview Coach</h1>
              <p className="text-muted-foreground">
                Practice makes perfect - ace your next interview
              </p>
            </div>
          </div>
          <Badge variant="secondary" className="mt-2">
            <Sparkles className="w-3 h-3 mr-1" />
            Powered by AI
          </Badge>
        </div>

        {/* Setup State */}
        {state === "setup" && (
          <Card>
            <CardHeader>
              <CardTitle>Set Up Your Practice Session</CardTitle>
              <CardDescription>
                Configure the interview based on your target job
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label>Job Title</Label>
                  <Select value={jobTitle} onValueChange={setJobTitle}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select job title" />
                    </SelectTrigger>
                    <SelectContent>
                      {JOB_TITLES.map((job) => (
                        <SelectItem key={job.id} value={job.id}>
                          {job.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Experience Level</Label>
                  <Select value={experienceLevel} onValueChange={(v) => setExperienceLevel(v as typeof experienceLevel)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {EXPERIENCE_LEVELS.map((level) => (
                        <SelectItem key={level.id} value={level.id}>
                          {level.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-3">
                <Label>Required Processes</Label>
                <div className="flex flex-wrap gap-2">
                  {WELD_PROCESSES_FULL.map((process) => (
                    <Badge
                      key={process.id}
                      variant={selectedProcesses.includes(process.id) ? "default" : "outline"}
                      className="cursor-pointer"
                      onClick={() => toggleProcess(process.id)}
                    >
                      {process.label}
                    </Badge>
                  ))}
                </div>
              </div>

              <div className="space-y-3">
                <Label>Required Certifications</Label>
                <div className="flex flex-wrap gap-2">
                  {CERTIFICATIONS_LIST.map((cert) => (
                    <Badge
                      key={cert.id}
                      variant={selectedCerts.includes(cert.id) ? "default" : "outline"}
                      className="cursor-pointer"
                      onClick={() => toggleCert(cert.id)}
                    >
                      {cert.label}
                    </Badge>
                  ))}
                </div>
              </div>

              <Separator />

              <div className="grid md:grid-cols-3 gap-6">
                <div className="space-y-2">
                  <Label>Number of Questions</Label>
                  <Select value={questionCount} onValueChange={setQuestionCount}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {["3", "5", "7", "10"].map((n) => (
                        <SelectItem key={n} value={n}>
                          {n} questions
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Difficulty</Label>
                  <Select value={difficulty} onValueChange={(v) => setDifficulty(v as typeof difficulty)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {DIFFICULTY_LEVELS.map((level) => (
                        <SelectItem key={level.id} value={level.id}>
                          {level.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-3">
                  <Label>Question Types</Label>
                  <div className="flex flex-wrap gap-2">
                    {QUESTION_TYPES.map((type) => (
                      <Badge
                        key={type.id}
                        variant={selectedTypes.includes(type.id) ? "default" : "outline"}
                        className="cursor-pointer text-xs"
                        onClick={() => toggleType(type.id)}
                      >
                        {type.label}
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>

              <Button size="lg" className="w-full" onClick={handleStartInterview}>
                <Play className="w-4 h-4 mr-2" />
                Start Practice Interview
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Interview State */}
        {state === "interview" && currentQuestion && (
          <div className="space-y-6">
            {/* Progress */}
            <Card>
              <CardContent className="py-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium">
                    Question {currentQuestionIndex + 1} of {questions.length}
                  </span>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Clock className="w-4 h-4" />
                    {Math.floor(timeRemaining / 60)}:{(timeRemaining % 60).toString().padStart(2, "0")}
                  </div>
                </div>
                <Progress value={progress} className="h-2" />
              </CardContent>
            </Card>

            {/* Question */}
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Badge variant="outline">{currentQuestion.type.toUpperCase()}</Badge>
                  <Badge variant="secondary">{currentQuestion.difficulty}</Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                <p className="text-lg font-medium">{currentQuestion.question}</p>

                <div className="text-xs text-muted-foreground">
                  Skills Tested: {currentQuestion.skillsTested.join(", ")}
                </div>

                <Separator />

                <div className="space-y-3">
                  <Label>Your Answer</Label>
                  <Textarea
                    value={userAnswer}
                    onChange={(e) => setUserAnswer(e.target.value)}
                    placeholder="Type your answer here..."
                    className="min-h-[150px]"
                  />
                </div>

                <div className="flex gap-3">
                  <Button variant="outline" onClick={handleSkipQuestion}>
                    <SkipForward className="w-4 h-4 mr-2" />
                    Skip
                  </Button>
                  <Button className="flex-1" onClick={handleSubmitAnswer}>
                    <Send className="w-4 h-4 mr-2" />
                    Submit Answer
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Feedback State */}
        {state === "feedback" && currentFeedback && (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>📊 Answer Evaluation</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex flex-wrap items-center justify-center gap-6">
                  <ScoreCircle
                    score={currentFeedback.data.score}
                    size="lg"
                    showGrade
                  />
                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-center p-3 bg-muted rounded-lg">
                      <div className="text-2xl font-bold">{currentFeedback.data.evaluation.technicalAccuracy}%</div>
                      <div className="text-xs text-muted-foreground">Technical</div>
                    </div>
                    <div className="text-center p-3 bg-muted rounded-lg">
                      <div className="text-2xl font-bold">{currentFeedback.data.evaluation.completeness}%</div>
                      <div className="text-xs text-muted-foreground">Completeness</div>
                    </div>
                    <div className="text-center p-3 bg-muted rounded-lg">
                      <div className="text-2xl font-bold">{currentFeedback.data.evaluation.communication}%</div>
                      <div className="text-xs text-muted-foreground">Communication</div>
                    </div>
                    <div className="text-center p-3 bg-muted rounded-lg">
                      <div className="text-2xl font-bold">{currentFeedback.data.evaluation.confidence}%</div>
                      <div className="text-xs text-muted-foreground">Confidence</div>
                    </div>
                  </div>
                </div>

                <Card className="bg-muted/50">
                  <CardContent className="pt-4">
                    <p className="text-sm">{currentFeedback.data.feedback.summary}</p>
                  </CardContent>
                </Card>

                {currentFeedback.data.feedback.strengths.length > 0 && (
                  <div>
                    <h4 className="font-medium mb-2 flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-green-600" />
                      Strengths
                    </h4>
                    <ul className="space-y-1">
                      {currentFeedback.data.feedback.strengths.map((s, i) => (
                        <li key={i} className="text-sm flex items-start gap-2">
                          <span className="text-green-600">•</span>
                          {s}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {currentFeedback.data.feedback.improvements.length > 0 && (
                  <div>
                    <h4 className="font-medium mb-2 flex items-center gap-2">
                      <Target className="w-4 h-4 text-yellow-600" />
                      Areas to Improve
                    </h4>
                    <ul className="space-y-1">
                      {currentFeedback.data.feedback.improvements.map((s, i) => (
                        <li key={i} className="text-sm flex items-start gap-2">
                          <span className="text-yellow-600">•</span>
                          {s}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {currentFeedback.data.coachingTips.length > 0 && (
                  <div className="p-4 bg-accent/10 rounded-lg">
                    <h4 className="font-medium mb-2 flex items-center gap-2">
                      <Lightbulb className="w-4 h-4 text-accent" />
                      Coaching Tip
                    </h4>
                    <p className="text-sm">{currentFeedback.data.coachingTips[0].tip}</p>
                    {currentFeedback.data.coachingTips[0].example && (
                      <p className="text-sm text-muted-foreground mt-2 italic">
                        Example: {currentFeedback.data.coachingTips[0].example}
                      </p>
                    )}
                  </div>
                )}

                <div className="flex gap-3">
                  <Button
                    variant="outline"
                    onClick={() => setShowIdealAnswer(!showIdealAnswer)}
                  >
                    {showIdealAnswer ? "Hide" : "See"} Ideal Answer
                  </Button>
                  <Button className="flex-1" onClick={handleNextQuestion}>
                    {currentQuestionIndex < questions.length - 1 ? (
                      <>
                        Next Question
                        <ChevronRight className="w-4 h-4 ml-2" />
                      </>
                    ) : (
                      <>
                        View Summary
                        <Trophy className="w-4 h-4 ml-2" />
                      </>
                    )}
                  </Button>
                </div>

                {showIdealAnswer && (
                  <Card className="bg-green-50 dark:bg-green-950 border-green-200">
                    <CardContent className="pt-4">
                      <h4 className="font-medium mb-2 text-green-700 dark:text-green-300">
                        Ideal Answer
                      </h4>
                      <p className="text-sm">{currentFeedback.data.idealAnswer}</p>
                    </CardContent>
                  </Card>
                )}
              </CardContent>
            </Card>
          </div>
        )}

        {/* Summary State */}
        {state === "summary" && (
          <div className="space-y-6">
            <Card>
              <CardHeader className="text-center">
                <div className="w-16 h-16 mx-auto rounded-full bg-accent/10 flex items-center justify-center mb-4">
                  <Trophy className="w-8 h-8 text-accent" />
                </div>
                <CardTitle className="text-2xl">Interview Complete!</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {summary ? (
                  <>
                    <div className="flex flex-wrap items-center justify-center gap-6">
                      <ScoreCircle
                        score={summary.data.overallScore}
                        label="Overall Score"
                        size="lg"
                        showGrade
                      />
                      <div className="text-center">
                        <Badge
                          variant={
                            summary.data.recommendation === "strong_hire"
                              ? "default"
                              : summary.data.recommendation === "hire"
                              ? "secondary"
                              : "outline"
                          }
                          className="text-lg px-4 py-2"
                        >
                          {summary.data.recommendation === "strong_hire"
                            ? "✅ STRONG HIRE"
                            : summary.data.recommendation === "hire"
                            ? "✅ HIRE"
                            : summary.data.recommendation === "maybe"
                            ? "🤔 MAYBE"
                            : "❌ NEEDS WORK"}
                        </Badge>
                      </div>
                    </div>

                    <Card className="bg-muted/50">
                      <CardContent className="pt-4">
                        <p className="text-sm">{summary.data.summary}</p>
                      </CardContent>
                    </Card>

                    <div>
                      <h4 className="font-medium mb-3">Category Breakdown</h4>
                      <div className="space-y-3">
                        {Object.entries(summary.data.categoryScores).map(([key, value]) => (
                          <div key={key}>
                            <div className="flex justify-between text-sm mb-1">
                              <span className="capitalize">{key.replace(/([A-Z])/g, " $1")}</span>
                              <span>{value}%</span>
                            </div>
                            <Progress value={value} className="h-2" />
                          </div>
                        ))}
                      </div>
                    </div>

                    {summary.data.topStrengths.length > 0 && (
                      <div>
                        <h4 className="font-medium mb-2">🌟 Top Strengths</h4>
                        <ul className="space-y-1">
                          {summary.data.topStrengths.map((s, i) => (
                            <li key={i} className="text-sm">• {s}</li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {summary.data.developmentPlan.length > 0 && (
                      <div>
                        <h4 className="font-medium mb-3">📚 Development Plan</h4>
                        <div className="space-y-3">
                          {summary.data.developmentPlan.map((item, i) => (
                            <Card key={i}>
                              <CardContent className="py-3">
                                <div className="font-medium text-sm">{item.skill}</div>
                                <div className="text-xs text-muted-foreground">
                                  {item.currentLevel} → Target: {item.recommendation}
                                </div>
                                <div className="text-xs text-muted-foreground mt-1">
                                  Timeline: {item.timeline}
                                </div>
                              </CardContent>
                            </Card>
                          ))}
                        </div>
                      </div>
                    )}
                  </>
                ) : (
                  <div className="text-center text-muted-foreground">
                    <p>Interview completed. Summary unavailable.</p>
                    <p className="text-sm mt-2">
                      You answered {responses.length} questions.
                    </p>
                  </div>
                )}

                <div className="flex gap-3 pt-4">
                  <Button variant="outline">
                    <Download className="w-4 h-4 mr-2" />
                    Download Report
                  </Button>
                  <Button onClick={handleRestart}>
                    <RotateCcw className="w-4 h-4 mr-2" />
                    Practice Again
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
