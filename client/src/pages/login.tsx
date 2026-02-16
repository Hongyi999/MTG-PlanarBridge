import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Loader2, Phone, Shield, User } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface LoginProps {
  onLogin: (user: any) => void;
}

export default function Login({ onLogin }: LoginProps) {
  const [step, setStep] = useState<"phone" | "code">("phone");
  const [phone, setPhone] = useState("");
  const [code, setCode] = useState("");
  const [wechatNickname, setWechatNickname] = useState("");
  const [sending, setSending] = useState(false);
  const [logging, setLogging] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const { toast } = useToast();

  const isValidPhone = /^1[3-9]\d{9}$/.test(phone);

  const sendCode = async () => {
    if (!isValidPhone) return;
    setSending(true);
    try {
      const res = await apiRequest("POST", "/api/auth/send-code", { phone });
      const data = await res.json();
      if (data.success) {
        setStep("code");
        toast({ title: "验证码已发送", description: `验证码: ${data.code}` });
        // Start countdown
        setCountdown(60);
        const timer = setInterval(() => {
          setCountdown(prev => {
            if (prev <= 1) { clearInterval(timer); return 0; }
            return prev - 1;
          });
        }, 1000);
      }
    } catch (err: any) {
      toast({ title: "发送失败", description: err.message, variant: "destructive" });
    } finally {
      setSending(false);
    }
  };

  const login = async () => {
    if (!code || code.length !== 6) return;
    setLogging(true);
    try {
      const res = await apiRequest("POST", "/api/auth/login", {
        phone,
        code,
        wechatNickname: wechatNickname || undefined,
      });
      const data = await res.json();
      if (data.user) {
        toast({ title: "登录成功", description: `欢迎, ${data.user.username}` });
        onLogin(data.user);
      }
    } catch (err: any) {
      toast({ title: "登录失败", description: err.message, variant: "destructive" });
    } finally {
      setLogging(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex flex-col items-center justify-center space-y-8 px-4">
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-heading font-bold text-primary">MTG PlanarBridge</h1>
        <p className="text-sm text-muted-foreground">万智牌价格查询与社区平台</p>
      </div>

      <Card className="w-full max-w-sm border-primary/20">
        <CardContent className="p-6 space-y-5">
          {step === "phone" ? (
            <>
              <div className="space-y-2">
                <label className="text-sm font-medium flex items-center gap-2">
                  <Phone className="w-4 h-4" /> 手机号
                </label>
                <Input
                  type="tel"
                  placeholder="输入手机号"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  maxLength={11}
                  className="h-11"
                  data-testid="input-phone"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium flex items-center gap-2">
                  <User className="w-4 h-4" /> 微信昵称 (选填)
                </label>
                <Input
                  placeholder="输入微信昵称，方便交易时联系"
                  value={wechatNickname}
                  onChange={(e) => setWechatNickname(e.target.value)}
                  className="h-11"
                  data-testid="input-wechat"
                />
                <p className="text-[10px] text-muted-foreground">首次登录自动注册，昵称可稍后修改</p>
              </div>

              <Button
                className="w-full h-11"
                disabled={!isValidPhone || sending}
                onClick={sendCode}
                data-testid="button-send-code"
              >
                {sending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                获取验证码
              </Button>
            </>
          ) : (
            <>
              <div className="text-center space-y-1">
                <Shield className="w-8 h-8 text-primary mx-auto" />
                <p className="text-sm text-muted-foreground">验证码已发送至 {phone}</p>
              </div>

              <div className="space-y-2">
                <Input
                  type="text"
                  placeholder="输入6位验证码"
                  value={code}
                  onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                  maxLength={6}
                  className="h-12 text-center text-xl font-mono tracking-[0.5em]"
                  data-testid="input-code"
                />
              </div>

              <Button
                className="w-full h-11"
                disabled={code.length !== 6 || logging}
                onClick={login}
                data-testid="button-login"
              >
                {logging ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                登录
              </Button>

              <div className="flex items-center justify-between">
                <Button variant="ghost" size="sm" className="text-xs" onClick={() => { setStep("phone"); setCode(""); }}>
                  更换手机号
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-xs"
                  disabled={countdown > 0 || sending}
                  onClick={sendCode}
                >
                  {countdown > 0 ? `${countdown}s 后重发` : "重新发送"}
                </Button>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      <p className="text-[10px] text-muted-foreground text-center">
        登录即表示同意《用户协议》和《隐私政策》
      </p>
    </div>
  );
}
