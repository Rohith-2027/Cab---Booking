export default function BookingTimeline({ status }) {
  const steps = [
    { key: "requested", label: "Requested" },
    { key: "accepted", label: "Accepted" },
    { key: "assigned", label: "Assigned" },
    { key: "started", label: "Started" },
    { key: "completed", label: "Completed" },
  ];

  const currentIndex = steps.findIndex(s => s.key === status);

  return (
    <div className="flex items-center justify-between mt-6">
      {steps.map((step, index) => {
        const isCompleted = index < currentIndex;
        const isActive = index === currentIndex;

        return (
          <div key={step.key} className="flex-1 flex flex-col items-center">
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold
                ${
                  isCompleted
                    ? "bg-green-500 text-white"
                    : isActive
                    ? "bg-indigo-600 text-white"
                    : "bg-gray-300 text-gray-600"
                }`}
            >
              {index + 1}
            </div>

            <p className="text-xs mt-2 text-center">
              {step.label}
            </p>

            {index !== steps.length - 1 && (
              <div
                className={`h-1 w-full mt-2
                  ${isCompleted ? "bg-green-500" : "bg-gray-300"}`}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}
