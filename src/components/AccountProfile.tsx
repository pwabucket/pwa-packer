import { useMemo } from "react";
import { copyToClipboard, extractTgWebAppData } from "../lib/utils";
import { MdOutlineContentCopy } from "react-icons/md";

interface AccountProfileProps {
  url: string;
}
const AccountProfile = ({ url }: AccountProfileProps) => {
  const user = useMemo(() => {
    return extractTgWebAppData(url)["initDataUnsafe"]["user"];
  }, [url]);

  return (
    <div className="flex items-center gap-2 text-xs max-w-3/4 mx-auto">
      <img
        src={user?.photo_url as string}
        alt="User Avatar"
        className="size-10 rounded-full shrink-0"
      />
      <div className="flex flex-col min-w-0">
        <h2 className="font-bold truncate text-yellow-500">
          {user?.first_name} {user?.last_name}
        </h2>
        {user?.username && (
          <p className="text-neutral-400 truncate">@{user.username}</p>
        )}
        <p className="text-purple-300">
          <button
            onClick={() => copyToClipboard(user?.id.toString() || "")}
            className="text-xs cursor-pointer"
          >
            ID: {user?.id} <MdOutlineContentCopy className="inline-block" />
          </button>
        </p>
      </div>
    </div>
  );
};

export { AccountProfile };
