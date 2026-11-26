import { useRouter } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { format } from "date-fns";
import { useOptimistic, useState, useTransition } from "react";

import { acknowledgeScheduledTransactionNoticesFn } from "@/app/finance/scheduled/scheduled.functions";
import { Button } from "@/components/ui/button";
import { Card, CardAction, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { GridList } from "@/components/ui/grid-list";
import { formatCurrency } from "@/lib/currency";

import { Route } from "../..";
import { TransactionListItem } from "../../../-common/components/transaction-list-item";

export const ScheduledTransactionNotice = () => {
    const { pendingScheduledTransactions } = Route.useLoaderData();
    const router = useRouter();
    const acknowledgeNotices = useServerFn(acknowledgeScheduledTransactionNoticesFn);
    const [acknowledgedNoticeIds, setAcknowledgedNoticeIds] = useState<Set<string>>(
        () => new Set(),
    );
    const unacknowledged = pendingScheduledTransactions.filter(
        (notice) => !acknowledgedNoticeIds.has(notice.noticeId),
    );
    const [queue, removeNoticesOptimistically] = useOptimistic(
        unacknowledged,
        (currentQueue, noticeIds: Array<string>) =>
            currentQueue.filter((notice) => !noticeIds.includes(notice.noticeId)),
    );
    const [isAcknowledging, startAcknowledging] = useTransition();

    if (queue.length === 0) {
        return null;
    }

    const handleAcknowledge = () => {
        const noticeIds = queue.map((notice) => notice.noticeId);

        startAcknowledging(async () => {
            removeNoticesOptimistically(noticeIds);

            try {
                await acknowledgeNotices({ data: noticeIds });
            } catch {
                // Optimistic removal reverts when the transition ends.
                return;
            }

            setAcknowledgedNoticeIds((current) => new Set([...current, ...noticeIds]));
            await router.invalidate({ sync: true }).catch(() => undefined);
        });
    };

    return (
        <Card
            data-testid="scheduled-transaction-notice"
            role="status"
            className="w-full gap-0 py-0"
        >
            <CardHeader variant="flat" className="justify-between">
                <CardTitle variant="flat">Recently added transactions</CardTitle>
                <CardAction>
                    <Button
                        size="xs"
                        variant="outline"
                        onPress={handleAcknowledge}
                        isDisabled={isAcknowledging}
                        aria-label="Acknowledge scheduled transactions"
                        data-testid="acknowledge-scheduled-transaction"
                    >
                        Acknowledge
                    </Button>
                </CardAction>
            </CardHeader>
            <CardContent className="max-h-[9.5rem] overflow-y-auto p-0">
                <GridList
                    items={queue}
                    aria-label="Recently added transactions"
                    className="w-full gap-0 text-sm"
                >
                    {(item) => (
                        <TransactionListItem
                            id={item.noticeId}
                            day={format(item.transactedAt, "dd")}
                            textValue={`${format(item.transactedAt, "MMMM d")}, ${item.description}, ${formatCurrency(item.amount, { sign: item.type === "income" ? "positive" : "negative" })}`}
                            amount={item.amount}
                            type={item.type}
                            category={item.category}
                        >
                            <span className="min-w-0 flex-1 truncate">{item.description}</span>
                        </TransactionListItem>
                    )}
                </GridList>
            </CardContent>
        </Card>
    );
};
