import http from 'k6/http';
import { check, sleep } from 'k6';

// Gate 3: the deployed service must serve 200s and stay under the latency SLO,
// otherwise the pipeline fails and the release is not considered healthy.
export const options = {
  vus: 5,
  duration: '20s',
  thresholds: {
    http_req_failed: ['rate<0.01'],     // <1% errors
    http_req_duration: ['p(95)<500'],   // 95th percentile under 500ms
  },
};

const BASE = __ENV.TARGET_URL || 'http://localhost:8080';

export default function () {
  const res = http.get(`${BASE}/`);
  check(res, { 'status is 200': (r) => r.status === 200 });
  sleep(1);
}
