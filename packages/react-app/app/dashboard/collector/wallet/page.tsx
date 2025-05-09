"use client"

import { DashboardHeader } from "@/components/dashboard/header"
import { DashboardShell } from "@/components/dashboard/shell"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import {
  IconArrowDown,
  IconArrowUp,
  IconCopy,
  IconRefresh,
  IconSend,
} from "@tabler/icons-react"

interface TransactionProps {
  type: "Deposit" | "Withdrawal"
  description: string
  amount: string
  date: string
}

function Transaction({ type, description, amount, date }: TransactionProps) {
  const isDeposit = type === "Deposit"
  return (
    <div className="flex items-center justify-between border-b py-4 last:border-0">
      <div className="flex items-center gap-3">
        <div
          className={`rounded-full p-2 ${
            isDeposit ? "bg-green-100" : "bg-red-100"
          }`}
        >
          {isDeposit ? (
            <IconArrowDown
              className="h-4 w-4 text-green-600"
              style={{ transform: "rotate(45deg)" }}
            />
          ) : (
            <IconArrowUp
              className="h-4 w-4 text-red-600"
              style={{ transform: "rotate(45deg)" }}
            />
          )}
        </div>
        <div>
          <p className="font-medium">{type}</p>
          <p className="text-sm text-muted-foreground">{description}</p>
        </div>
      </div>
      <div className="text-right">
        <p
          className={`font-medium ${
            isDeposit ? "text-green-600" : "text-red-600"
          }`}
        >
          {isDeposit ? "+" : "-"}
          {amount}
        </p>
        <p className="text-sm text-muted-foreground">{date}</p>
      </div>
    </div>
  )
}

export default function WalletPage() {
  return (
    <DashboardShell>
      <DashboardHeader
        heading="Digital Wallet"
        text="Manage your earnings, view transaction history, and withdraw funds"
      />
      <div className="grid gap-6">
        {/* Wallet Balance */}
        <Card>
          <div className="p-6">
            <h2 className="text-lg font-semibold">Wallet Balance</h2>
            <p className="text-sm text-muted-foreground">
              Your current balance and recent activity
            </p>
            <div className="mt-4">
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-bold">$120.50</span>
                <Badge variant="secondary">+$24.00 this week</Badge>
              </div>
              <div className="mt-6 flex gap-2">
                <Button className="flex-1">
                  <IconArrowDown className="mr-2 h-4 w-4" />
                  Deposit
                </Button>
                <Button className="flex-1">
                  <IconArrowUp className="mr-2 h-4 w-4" />
                  Withdraw
                </Button>
                <Button variant="outline" className="flex-1">
                  <IconRefresh className="mr-2 h-4 w-4" />
                  Swap
                </Button>
                <Button variant="outline" className="flex-1">
                  <IconSend className="mr-2 h-4 w-4" />
                  Send
                </Button>
              </div>
              <div className="mt-6">
                <label className="text-sm font-medium">Wallet Address</label>
                <div className="mt-1.5 flex items-center gap-2">
                  <Input
                    readOnly
                    value="0x1a2b3c4d5e6f7g8h9i0j1k213m4n5o6p7q8t9s0t"
                  />
                  <Button variant="outline" size="icon">
                    <IconCopy className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </Card>

        {/* Quick Actions */}
        <Card>
          <div className="p-6">
            <h2 className="text-lg font-semibold">Quick Actions</h2>
            <p className="text-sm text-muted-foreground">Common wallet operations</p>
            <div className="mt-4">
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium">Withdraw to Mobile Money</label>
                  <div className="mt-1.5 space-y-2">
                    <Input placeholder="Enter amount" />
                    <Input placeholder="Enter phone number" />
                    <Button className="w-full">Withdraw</Button>
                  </div>
                </div>
                <div>
                  <h3 className="text-sm font-medium">Pending Transactions</h3>
                  <div className="mt-2 rounded-lg bg-muted p-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <IconRefresh className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm">Withdrawal</span>
                      </div>
                      <span className="text-sm font-medium">$25.00</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </Card>

        {/* Transaction History */}
        <Card>
          <div className="p-6">
            <h2 className="text-lg font-semibold">Transaction History</h2>
            <p className="text-sm text-muted-foreground">
              Your recent wallet transactions
            </p>
            <div className="mt-4">
              <div className="flex gap-2">
                <Button variant="outline" className="flex-1">
                  All Transactions
                </Button>
                <Button variant="outline" className="flex-1">
                  Deposits
                </Button>
                <Button variant="outline" className="flex-1">
                  Withdrawals
                </Button>
              </div>
              <div className="mt-4 divide-y">
                <Transaction
                  type="Deposit"
                  description="Collection Reward"
                  amount="$25.00"
                  date="Mar 20, 2023"
                />
                <Transaction
                  type="Withdrawal"
                  description="Mobile Money Transfer"
                  amount="$50.00"
                  date="Mar 18, 2023"
                />
                <Transaction
                  type="Deposit"
                  description="Collection Reward"
                  amount="$35.00"
                  date="Mar 15, 2023"
                />
                <Transaction
                  type="Deposit"
                  description="Collection Reward"
                  amount="$20.00"
                  date="Mar 12, 2023"
                />
              </div>
            </div>
          </div>
        </Card>
      </div>
    </DashboardShell>
  )
} 