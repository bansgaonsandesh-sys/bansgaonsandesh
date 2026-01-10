import { Spin } from 'antd'

export default function Loading() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <Spin size="large" />
    </div>
  )
}
