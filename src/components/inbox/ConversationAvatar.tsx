import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { isMetaCdnLikelyToBlockInlineEmbed } from "@/lib/restricted-media-hosts";
import { cn } from "@/lib/utils";

function getInitials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

function getConversationTone(name: string) {
  const tones = [
    "from-[#fff1e5] to-[#ffd7a8] text-[#e56b22]",
    "from-[#e9f8dd] to-[#bff06e] text-[#2f806b]",
    "from-[#e3f4ef] to-[#b7d8cc] text-[#226854]",
    "from-[#e8eef5] to-[#cad9e7] text-[#4E1BB1]",
  ];
  let hash = 0;

  for (let index = 0; index < name.length; index += 1) {
    hash = (hash + name.charCodeAt(index)) % tones.length;
  }

  return tones[hash];
}

export function ConversationAvatar({
  name,
  avatarUrl,
  size = "md",
}: {
  name: string;
  avatarUrl?: string | null;
  size?: "xs" | "sm" | "md";
}) {
  const safeAvatarUrl =
    avatarUrl && !isMetaCdnLikelyToBlockInlineEmbed(avatarUrl) ? avatarUrl : null;

  return (
    <Avatar
      className={cn(
        "border border-white/90 shadow-[0_10px_24px_rgba(37,63,51,0.10)]",
        size === "xs" ? "h-9 w-9" : size === "sm" ? "h-11 w-11" : "h-12 w-12",
      )}
    >
      {safeAvatarUrl ? <AvatarImage src={safeAvatarUrl} alt={name} /> : null}
      <AvatarFallback
        className={cn(
          `bg-gradient-to-br ${getConversationTone(name)} font-semibold`,
          size === "xs" ? "text-[10px]" : size === "sm" ? "text-xs" : "text-sm",
        )}
      >
        {getInitials(name)}
      </AvatarFallback>
    </Avatar>
  );
}
